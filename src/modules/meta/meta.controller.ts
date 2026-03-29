import { NextFunction, Request, Response } from "express";
import SiteModel from "../sites/site.model";
import { AppError } from "../../errors/AppError";
import { successResponse } from "../../utils/response";
import ConversionModel from "../conversions/conversion.model";
import SessionModel from "../tracking/models/session.model";

export class MetaController {
    static connect(req: Request, res: Response, next: NextFunction) {
        try {
            const { site_id } = req.query;
            const siteId = String(site_id || "");

            if (!siteId) {
                throw new AppError("site_id query parameter is required", 400);
            }

            const appId = process.env.META_APP_ID;
            const redirectUri = process.env.META_REDIRECT_URI;

            if (!appId || !redirectUri) {
                throw new AppError("Meta OAuth configuration is missing", 500);
            }

            const url = new URL("https://www.facebook.com/dialog/oauth");
            url.searchParams.set("client_id", appId);
            url.searchParams.set("redirect_uri", redirectUri);
            url.searchParams.set("scope", "ads_read,ads_management");
            url.searchParams.set("state", siteId);

            res.redirect(url.toString());
        } catch (error) {
            next(error);
        }
    }

    static async callback(req: Request, res: Response, next: NextFunction) {
        try {
            const { code, state } = req.query;
            const siteId = String(state || "");

            if (!code || !siteId) {
                throw new AppError("Missing code or siteId in callback", 400);
            }

            const appId = process.env.META_APP_ID;
            const appSecret = process.env.META_APP_SECRET;
            const redirectUri = process.env.META_REDIRECT_URI;

            if (!appId || !appSecret || !redirectUri) {
                throw new AppError("Meta OAuth configuration is missing", 500);
            }

            const tokenRes = await fetch(
                `https://graph.facebook.com/v23.0/oauth/access_token?client_id=${encodeURIComponent(appId)}` +
                `&client_secret=${encodeURIComponent(appSecret)}` +
                `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                `&code=${encodeURIComponent(String(code))}`
            ).then(r => r.json());

            if (!tokenRes || tokenRes.error) {
                throw new AppError("Failed to exchange code for Meta access token", 502);
            }

            const accessToken = tokenRes.access_token;
            if (!accessToken) {
                throw new AppError("Meta access token was not returned", 502);
            }

            const adAccountsRes = await fetch(
                `https://graph.facebook.com/v23.0/me/adaccounts?access_token=${encodeURIComponent(accessToken)}`
            ).then(r => r.json());

            if (!adAccountsRes || adAccountsRes.error) {
                throw new AppError("Failed to fetch Meta ad accounts", 502);
            }

            const adAccountId = adAccountsRes.data?.[0]?.id;

            const site = await SiteModel.findById(siteId);
            if (!site) throw new AppError("Site not found", 404);

            const metaIndex = site.integrations.findIndex(i => i.provider === "meta");
            if (metaIndex >= 0) {
                site.integrations[metaIndex].connected = true;
                site.integrations[metaIndex].accessToken = accessToken;
                site.integrations[metaIndex].accountId = adAccountId || undefined;
            } else {
                site.integrations.push({
                    provider: "meta",
                    connected: true,
                    accessToken,
                    accountId: adAccountId || undefined
                });
            }

            await site.save();

            res.redirect(`https://app.trackyflow.sbs/sites/${siteId}?success=meta_connected`);
        } catch (error) {
            next(error);
        }
    }

    static async getCampaigns(req: Request, res: Response, next: NextFunction) {
        try {
            const { siteId } = req.params;

            const site = await SiteModel.findById(siteId);
            if (!site) throw new AppError("Site not found", 404);

            const meta = site.integrations.find(i => i.provider === "meta");
            if (!meta?.connected || !meta.accessToken) {
                throw new AppError("Meta não conectado", 400);
            }

            const pixelId = meta.settings?.pixelId;

            const adAccountsRes = await fetch(
                `https://graph.facebook.com/v23.0/me/adaccounts?` +
                `fields=id,name,campaigns{id,name,status,insights{spend,impressions,clicks,actions,cpc,cpm},adsets{promoted_object}}&` +
                `access_token=${meta.accessToken}`
            ).then(r => r.json());

            const campaignStats = await SessionModel.aggregate([
                {
                    $match: {
                        siteId: site._id,
                        "utm.utm_campaign": { $exists: true, $ne: null }
                    }
                },
                {
                    $addFields: {
                        campaignId: {
                            $cond: {
                                if: { $gt: [{ $indexOfBytes: ["$utm.utm_campaign", "|"] }, -1] },
                                then: { $arrayElemAt: [{ $split: ["$utm.utm_campaign", "|"] }, 1] },
                                else: "$utm.utm_campaign"
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: "$campaignId",
                        visits: { $sum: 1 }
                    }
                }
            ]);

            // console.log("visitsByCampaignId:", campaignStats);
            const visitsByCampaignId = Object.fromEntries(
                campaignStats
                    .filter((s: any) => s._id)
                    .map((s: any) => [s._id, s.visits])
            );

            const allCampaigns: any[] = [];

            for (const account of adAccountsRes.data || []) {
                const filtered = (account.campaigns?.data || []).filter((c: any) => {
                    if (!pixelId) return true;
                    return c.adsets?.data?.some((adset: any) =>
                        adset.promoted_object?.pixel_id === pixelId
                    );
                });

                allCampaigns.push(...filtered
                    .filter((c: any) => c.status === "ACTIVE" || visitsByCampaignId[c.id] > 0)
                    .map((c: any) => {
                        const insights = c.insights?.data?.[0] || {};
                        const spend = Number(insights.spend || 0);
                        const clicks = Number(insights.clicks || 0);
                        const impressions = Number(insights.impressions || 0);
                        const purchases = insights.actions?.find((a: any) => a.action_type === "purchase");
                        const sales = Number(purchases?.value || 0);
                        const visits = visitsByCampaignId[c.id] || 0;
                        const revenue = sales * 0;

                        return {
                            id: c.id,
                            name: c.name,
                            status: c.status === "ACTIVE" ? "active" : "paused",
                            account: account.name,
                            spend,
                            impressions,
                            clicks,
                            visits,
                            sales,
                            revenue,
                            cpc: Number(insights.cpc || 0),
                            cpm: Number(insights.cpm || 0),
                            ctr: impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0,
                            roi: spend > 0 ? revenue / spend : 0
                        };
                    })
                );
            }

            return successResponse(res, "Campanhas obtidas.", allCampaigns);
        } catch (error) {
            next(error);
        }
    }

    static async saveToken(req: Request, res: Response, next: NextFunction) {
        try {
            const { siteId } = req.params;
            const { accessToken, pixelId } = req.body;

            const test = await fetch(
                `https://graph.facebook.com/v23.0/me?access_token=${accessToken}`
            ).then(r => r.json());

            if (test.error) throw new AppError("Token inválido", 400);

            const adAccountsRes = await fetch(
                `https://graph.facebook.com/v23.0/me/adaccounts?fields=id,name&access_token=${accessToken}`
            ).then(r => r.json());

            const adAccountId = adAccountsRes.data?.[0]?.id;
            if (!adAccountId) throw new AppError("Nenhuma conta de anúncio encontrada", 404);

            const site = await SiteModel.findById(siteId);
            if (!site) throw new AppError("Site not found", 404);

            const metaIndex = site.integrations.findIndex(i => i.provider === "meta");
            if (metaIndex >= 0) {
                site.integrations[metaIndex].connected = true;
                site.integrations[metaIndex].accessToken = accessToken;
                site.integrations[metaIndex].accountId = adAccountId;
                site.integrations[metaIndex].settings = { pixelId: pixelId || null };
            } else {
                site.integrations.push({
                    provider: "meta",
                    connected: true,
                    accessToken,
                    accountId: adAccountId,
                    settings: { pixelId: pixelId || null }
                });
            }

            await site.save();
            return successResponse(res, "Meta conectado com sucesso");
        } catch (error) {
            next(error);
        }
    }

    static async getSummary(req: Request, res: Response, next: NextFunction) {
        try {
            const { siteId } = req.params;

            const site = await SiteModel.findById(siteId);
            if (!site) throw new AppError("Site not found", 404);
            const meta = site?.integrations.find(i => i.provider === "meta");

            if (!meta?.connected || !meta.accessToken) {
                throw new AppError("Meta não conectado", 400);
            }

            const summaryRes = await fetch(
                `https://graph.facebook.com/v23.0/${meta.accountId}/insights?` +
                `fields=spend,impressions,clicks,actions,cpc,cpm&` +
                `date_preset=last_30d&` +
                `access_token=${meta.accessToken}`
            ).then(r => r.json());

            const insights = summaryRes.data?.[0] || {};
            const purchases = insights.actions?.find((a: any) => a.action_type === "purchase");
            const spend = Number(insights.spend || 0);
            const sales = Number(purchases?.value || 0);

            const conversions = await ConversionModel.aggregate([
                { $match: { siteId: site._id } },
                { $group: { _id: null, revenue: { $sum: "$value" } } }
            ]);
            const revenue = conversions[0]?.revenue || 0;
            const roas = spend > 0 ? revenue / spend : 0;

            return successResponse(res, {
                spend,
                impressions: Number(insights.impressions || 0),
                clicks: Number(insights.clicks || 0),
                sales,
                cpc: Number(insights.cpc || 0),
                cpm: Number(insights.cpm || 0),
                roas
            } as any);
        } catch (error) {
            next(error);
        }
    }
}
