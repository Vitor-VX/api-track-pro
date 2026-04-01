import { NextFunction, Request, Response } from "express";
import { AppError } from "../../errors/AppError";
import { successResponse } from "../../utils/response";
import SiteModel from "../sites/site.model";
import ConversionModel from "../conversions/conversion.model";
import SessionModel from "../tracking/models/session.model";

type DatePreset = "today" | "yesterday" | "last_7d" | "last_30d" | "last_90d";

interface DateRange {
    since: string;
    until: string;
}

interface MetaInsights {
    spend?: string;
    impressions?: string;
    clicks?: string;
    cpc?: string;
    cpm?: string;
    actions?: { action_type: string; value: string }[];
}

interface MetaAdset {
    promoted_object?: {
        pixel_id?: string;
    };
    id: string;
}

interface MetaCampaign {
    id: string;
    name: string;
    status: string;
    insights?: { data: MetaInsights[] };
    adsets?: { data: MetaAdset[] };
}

interface MetaAdAccount {
    id: string;
    name: string;
}

interface CampaignResult {
    id: string;
    name: string;
    status: string;
    account: string;
    spend: number;
    impressions: number;
    clicks: number;
    visits: number;
    sales: number;
    revenue: number;
    cpc: number;
    cpm: number;
    ctr: number;
    cpa: number;
    roi: number;
}

function getDateRange(preset: DatePreset = "today"): DateRange {
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    const daysAgo = (n: number) => {
        const d = new Date(now);
        d.setDate(d.getDate() - n);
        return d.toISOString().split("T")[0];
    };

    const ranges: Record<DatePreset, DateRange> = {
        today: { since: today, until: today },
        yesterday: { since: daysAgo(1), until: daysAgo(1) },
        last_7d: { since: daysAgo(7), until: today },
        last_30d: { since: daysAgo(30), until: today },
        last_90d: { since: daysAgo(90), until: today },
    };

    return ranges[preset];
}

async function fetchAdAccounts(accessToken: string): Promise<MetaAdAccount[]> {
    const res = await fetch(
        `https://graph.facebook.com/v23.0/me/adaccounts?fields=id,name&access_token=${accessToken}`
    ).then(r => r.json());
    return res.data || [];
}

async function fetchActiveCampaigns(
    accountId: string,
    accessToken: string,
    dateRange: DateRange
): Promise<MetaCampaign[]> {
    const filtering = encodeURIComponent(JSON.stringify([
        { field: "effective_status", operator: "IN", value: ["ACTIVE"] }
    ]));

    const timeRange = encodeURIComponent(JSON.stringify({
        since: dateRange.since,
        until: dateRange.until
    }));

    const res = await fetch(
        `https://graph.facebook.com/v23.0/${accountId}/campaigns?` +
        `fields=id,name,status,insights.time_range(${timeRange}){spend,impressions,clicks,actions,cpc,cpm},adsets{promoted_object}&` +
        `filtering=${filtering}&limit=100&access_token=${accessToken}`
    ).then(r => r.json());

    return res.data || [];
}

async function fetchRevenueByCampaignId(
    siteId: any,
    dateRange: DateRange
): Promise<Record<string, number>> {
    const stats = await ConversionModel.aggregate([
        {
            $match: {
                siteId,
                createdAt: {
                    $gte: new Date(dateRange.since),
                    $lte: new Date(dateRange.until + "T23:59:59.999Z")
                },
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
                revenue: { $sum: "$value" },
                sales: { $sum: 1 }
            }
        }
    ]);

    return Object.fromEntries(
        stats.map((s: any) => [
            s._id,
            { revenue: s.revenue, sales: s.sales }
        ])
    );
}

async function fetchVisitsByCampaignId(
    siteId: any,
    dateRange: DateRange
): Promise<Record<string, number>> {
    const stats = await SessionModel.aggregate([
        {
            $match: {
                siteId,
                "utm.utm_campaign": { $exists: true, $ne: null },
                createdAt: {
                    $gte: new Date(dateRange.since),
                    $lte: new Date(dateRange.until + "T23:59:59.999Z")
                }
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

    return Object.fromEntries(
        stats
            .filter((s: any) => s._id)
            .map((s: any) => [s._id, s.visits])
    );
}

function mapCampaign(
    campaign: MetaCampaign,
    account: MetaAdAccount,
    visitsByCampaignId: Record<string, number>,
    revenueByCampaignId: any
): CampaignResult {
    const insights = campaign.insights?.data?.[0] || {};
    const spend = Number(insights.spend || 0);
    const clicks = Number(insights.clicks || 0);
    const impressions = Number(insights.impressions || 0);
    const visits = visitsByCampaignId[campaign.id] || 0;
    const campaignData = revenueByCampaignId[campaign.id] || { revenue: 0, sales: 0 };

    const revenue = campaignData.revenue;
    const sales = campaignData.sales;

    return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status === "ACTIVE" ? "active" : "paused",
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
        cpa: sales > 0 ? Number((spend / sales).toFixed(2)) : 0,
        roi: spend > 0 ? revenue / spend : 0
    };
}

function filterByPixel(campaigns: MetaCampaign[], pixelId?: string): MetaCampaign[] {
    if (!pixelId) return campaigns;
    return campaigns.filter(c =>
        c.adsets?.data?.some(adset => adset.promoted_object?.pixel_id === pixelId)
    );
}

import crypto from "crypto";

function hash(value: string) {
    return crypto
        .createHash("sha256")
        .update(value.trim().toLowerCase())
        .digest("hex");
}

async function sendPurchaseToMeta({
    pixelId,
    accessToken,
    value,
    orderId,
    email,
    phone,
    fbc,
    fbp,
    clientIp,
    userAgent,
    req
}: {
    pixelId: string;
    accessToken: string;
    value: number;
    orderId: string;
    email?: string;
    phone?: string;
    fbc?: string;
    fbp?: string;
    clientIp?: string;
    userAgent?: string;
    req: Request;
}) {
    const payload = {
        data: [
            {
                event_name: "Purchase",
                event_time: Math.floor(Date.now() / 1000),
                event_id: orderId,
                action_source: "website",

                user_data: {
                    ...(email && { em: hash(email) }),
                    ...(phone && { ph: hash(phone) }),
                    client_ip_address: clientIp,
                    client_user_agent: userAgent,
                    fbc,
                    fbp
                },

                custom_data: {
                    value,
                    currency: "BRL",
                    content_ids: [
                        `product-${orderId}`
                    ],
                    content_type: "product"
                },
                opt_out: false
            }
        ]
    };

    try {
        const res = await fetch(
            `https://graph.facebook.com/v23.0/${pixelId}/events?access_token=${accessToken}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }
        );

        const data = await res.json();
        if (data.error) {
            console.error("Meta API error:", data.error);
        }

        return data;
    } catch (err) {
        console.error("Meta send error:", err);
    }
}

export class MetaController {

    static async sendPurchaseEvent(req: Request, res: Response, next: NextFunction) {
        try {
            const { siteId } = req.params;
            const {
                value,
                orderId,
                email,
                fbc,
                fbp,
                userAgent,
                clientIp,
                phone
            } = req.body;

            const site = await SiteModel.findById(siteId);
            if (!site) throw new AppError("Site not found", 404);

            const meta = site.integrations.find(i => i.provider === "meta");

            if (!meta?.connected || !meta.accessToken || !meta.settings?.pixelId) {
                throw new AppError("Meta não conectado corretamente", 400);
            }

            await sendPurchaseToMeta({
                pixelId: meta.settings.pixelId,
                accessToken: meta.accessToken,
                value,
                orderId,
                email,
                phone,
                fbc,
                fbp,
                clientIp,
                userAgent,
                req
            });

            return successResponse(res, "Evento enviado para Meta com sucesso");
        } catch (error) {
            next(error);
        }
    }

    static async getCampaigns(req: Request, res: Response, next: NextFunction) {
        try {
            const { siteId } = req.params;
            const preset = (req.query.preset as DatePreset) || "today";
            const dateRange = getDateRange(preset);

            const site = await SiteModel.findById(siteId);
            if (!site) throw new AppError("Site not found", 404);

            const meta = site.integrations.find(i => i.provider === "meta");
            if (!meta?.connected || !meta.accessToken) {
                throw new AppError("Meta não conectado", 400);
            }

            const [adAccounts, visitsByCampaignId, revenueByCampaignId] = await Promise.all([
                fetchAdAccounts(meta.accessToken),
                fetchVisitsByCampaignId(site._id, dateRange),
                fetchRevenueByCampaignId(site._id, dateRange)
            ]);

            const allCampaigns: CampaignResult[] = [];

            for (const account of adAccounts) {
                const campaigns = await fetchActiveCampaigns(account.id, meta.accessToken, dateRange);
                const filtered = filterByPixel(campaigns, meta.settings?.pixelId);
                allCampaigns.push(...filtered.map(c => mapCampaign(c, account, visitsByCampaignId, revenueByCampaignId)));
            }

            return successResponse(res, "Campanhas obtidas.", allCampaigns);
        } catch (error) {
            next(error);
        }
    }

    static async getSummary(req: Request, res: Response, next: NextFunction) {
        try {
            const { siteId } = req.params;
            const preset = (req.query.preset as DatePreset) || "today";
            const dateRange = getDateRange(preset);

            const site = await SiteModel.findById(siteId);
            if (!site) throw new AppError("Site not found", 404);

            const meta = site.integrations.find(i => i.provider === "meta");
            if (!meta?.connected || !meta.accessToken) {
                throw new AppError("Meta não conectado", 400);
            }

            const timeRange = encodeURIComponent(JSON.stringify({
                since: dateRange.since,
                until: dateRange.until
            }));

            const [summaryRes, conversions] = await Promise.all([
                fetch(
                    `https://graph.facebook.com/v23.0/${meta.accountId}/insights?` +
                    `fields=spend,impressions,clicks,actions,cpc,cpm&` +
                    `time_range=${timeRange}&` +
                    `access_token=${meta.accessToken}`
                ).then(r => r.json()),
                ConversionModel.aggregate([
                    {
                        $match: {
                            siteId: site._id,
                            createdAt: {
                                $gte: new Date(dateRange.since),
                                $lte: new Date(dateRange.until + "T23:59:59.999Z")
                            }
                        }
                    },
                    { $group: { _id: null, revenue: { $sum: "$value" } } }
                ])
            ]);

            const insights: MetaInsights = summaryRes.data?.[0] || {};
            const purchases = insights.actions?.find(a => a.action_type === "purchase");
            const spend = Number(insights.spend || 0);
            const revenue = conversions[0]?.revenue || 0;

            return successResponse(res, "Summray obtido com sucesso.", {
                spend,
                impressions: Number(insights.impressions || 0),
                clicks: Number(insights.clicks || 0),
                sales: Number(purchases?.value || 0),
                cpc: Number(insights.cpc || 0),
                cpm: Number(insights.cpm || 0),
                roas: spend > 0 ? revenue / spend : 0
            });
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

            const adAccounts = await fetchAdAccounts(accessToken);
            const adAccountId = adAccounts[0]?.id;
            if (!adAccountId) throw new AppError("Nenhuma conta de anúncio encontrada", 404);

            const site = await SiteModel.findById(siteId);
            if (!site) throw new AppError("Site not found", 404);

            const metaIndex = site.integrations.findIndex(i => i.provider === "meta");
            const integrationData = {
                provider: "meta",
                connected: true,
                accessToken,
                accountId: adAccountId,
                settings: { pixelId: pixelId || null }
            };

            if (metaIndex >= 0) {
                Object.assign(site.integrations[metaIndex], integrationData);
            } else {
                site.integrations.push(integrationData);
            }

            await site.save();
            return successResponse(res, "Meta conectado com sucesso");
        } catch (error) {
            next(error);
        }
    }
}