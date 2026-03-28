import { NextFunction, Request, Response } from "express";
import SiteModel from "../sites/site.model";
import { AppError } from "../../errors/AppError";

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
}
