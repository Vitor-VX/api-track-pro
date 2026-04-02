import SiteModel from "../sites/site.model";
import SessionModel from "../tracking/models/session.model";
import EventModel from "../tracking/models/event.model";
import ConversionModel from "../conversions/conversion.model";
import { startOfToday, endOfToday, last7Days, calculatePercentage } from "../../utils";
import { Types } from "mongoose";
import { ISessionDocument } from "../tracking/interfaces/session.interface";
import { AppError } from "../../errors/AppError";
import { MESSAGES } from "../../constants/messages";
import moment from "moment-timezone";

type IdItem = { _id: Types.ObjectId };
type CountItem = { _id: string; count: number };
type EventItem = { _id: string; count: number };
type DayStat = { _id: string; visits?: number; sales?: number };

export class MetricsService {
    static async globalDashboard(userId: string) {
        const sites = await SiteModel.find({ ownerId: userId }).select("_id");
        const siteIds = sites.map((s: IdItem) => s._id);

        const todayRange = {
            $gte: startOfToday(),
            $lte: endOfToday()
        };

        const visitorsToday = await SessionModel.countDocuments({
            siteId: { $in: siteIds },
            createdAt: todayRange
        });

        const salesToday = await ConversionModel.countDocuments({
            siteId: { $in: siteIds },
            createdAt: todayRange
        });

        const revenueTodayAgg = await ConversionModel.aggregate([
            {
                $match: {
                    siteId: { $in: siteIds },
                    createdAt: todayRange
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$value" }
                }
            }
        ]);

        const revenueToday = revenueTodayAgg[0]?.total || 0;
        const averageConversionRate = calculatePercentage(salesToday, visitorsToday);

        return {
            totalSites: siteIds.length,
            visitorsToday,
            salesToday,
            revenueToday,
            averageConversionRate
        };
    }

    static async overviewDashboard(userId: string) {
        const sites = await SiteModel.find({ ownerId: userId }).select("_id name domain integrations");
        const siteIds = sites.map((s: IdItem) => s._id);

        const todayRange = {
            $gte: startOfToday(),
            $lte: endOfToday()
        };

        console.log(todayRange.$gte);
        console.log(todayRange.$lte);
        

        const visitorsToday = await SessionModel.countDocuments({
            siteId: { $in: siteIds },
            createdAt: todayRange
        });

        const salesToday = await ConversionModel.countDocuments({
            siteId: { $in: siteIds },
            createdAt: todayRange
        });

        const revenueTodayAgg = await ConversionModel.aggregate([
            {
                $match: {
                    siteId: { $in: siteIds },
                    createdAt: todayRange
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$value" }
                }
            }
        ]);

        const revenueToday = revenueTodayAgg[0]?.total || 0;
        const averageConversionRate = calculatePercentage(salesToday, visitorsToday);

        const performance = await MetricsService.performanceLast7Days(userId);

        const sessionStats = await SessionModel.aggregate([
            { $match: { siteId: { $in: siteIds } } },
            { $group: { _id: "$siteId", visits: { $sum: 1 } } }
        ]);

        const conversionStats = await ConversionModel.aggregate([
            {
                $match: { siteId: { $in: siteIds } }
            },
            {
                $group: {
                    _id: "$siteId",
                    sales: { $sum: 1 },
                    revenue: { $sum: "$value" }
                }
            }
        ]);

        const siteMetrics = sites.map((site) => {
            const session = sessionStats.find((item: any) => item._id.toString() === site._id.toString());
            const conversion = conversionStats.find((item: any) => item._id.toString() === site._id.toString());
            const visitors = session?.visits || 0;
            const sales = conversion?.sales || 0;
            const revenue = conversion?.revenue || 0;
            const conversionRate = calculatePercentage(sales, visitors);

            const metaIntegration = site.integrations?.find(i => i.provider === "meta");

            return {
                id: site._id,
                name: site.name,
                domain: site.domain,
                totalVisitors: visitors,
                sales,
                revenue,
                conversion: conversionRate,
                campaignsActive: 0,
                integrationConnected: metaIntegration?.connected ?? false
            };
        });

        return {
            summary: {
                activeSites: siteIds.length,
                visitorsToday,
                salesToday,
                revenueToday,
                averageConversionRate
            },
            performance,
            sites: siteMetrics
        };
    }

    static async siteMetrics(userId: string, siteId: string) {
        const site = await SiteModel.findOne({ _id: siteId, ownerId: userId });
        if (!site) throw new AppError(MESSAGES.siteNotFound, 404);

        const sessions = await SessionModel.countDocuments({ siteId });
        const visitors = await SessionModel.distinct("visitorId", { siteId }).then(ids => ids.length);

        const conversions = await ConversionModel.countDocuments({ siteId });
        const revenueDoc = await ConversionModel.aggregate([
            { $match: { siteId: new Types.ObjectId(siteId) } },
            { $group: { _id: null, total: { $sum: '$value' } } }
        ]);
        const revenue = revenueDoc[0]?.total || 0;
        const conversionRate = calculatePercentage(conversions, visitors);
        const averageTicket = conversions > 0 ? revenue / conversions : 0;

        return { visitors, sessions, conversions, revenue, conversionRate, averageTicket };
    }

    static async performanceLast7Days(userId: string, siteId?: string) {
        const sites = siteId ? [new Types.ObjectId(siteId)] : (await SiteModel.find({ ownerId: userId }).select('_id')).map((s: IdItem) => s._id);
        const days = last7Days();

        const sessions = await SessionModel.aggregate([
            { $match: { siteId: { $in: sites }, createdAt: { $gte: days[0], $lte: endOfToday() } } },
            { $project: { day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'America/Sao_Paulo' } } } },
            { $group: { _id: '$day', visits: { $sum: 1 } } }
        ]);

        const conversions = await ConversionModel.aggregate([
            { $match: { siteId: { $in: sites }, createdAt: { $gte: days[0], $lte: endOfToday() } } },
            { $project: { day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'America/Sao_Paulo' } } } },
            { $group: { _id: '$day', sales: { $sum: 1 } } }
        ]);

        return days.map((d) => {
            const dayKey = moment(d)
                .tz("America/Sao_Paulo")
                .format("YYYY-MM-DD");
            const visits = sessions.find((i: DayStat) => i._id === dayKey)?.visits || 0;
            const sales = conversions.find((i: DayStat) => i._id === dayKey)?.sales || 0;
            return { date: dayKey, visits, sales };
        });
    }

    static async sourceTraffic(userId: string, siteId?: string) {
        const sites = siteId
            ? [new Types.ObjectId(siteId)]
            : (await SiteModel.find({ ownerId: userId }).select('_id')).map((s: IdItem) => s._id);

        const SOURCE_LABELS: Record<string, string> = {
            facebook: "Facebook / Meta",
            meta: "Facebook / Meta",
            instagram: "Instagram",
            google: "Google",
            direct: "Direct",
            organic: "Organic",
            referral: "Referral"
        };
        function formatSource(source?: string) {
            if (!source) return "Unknown";

            const key = source.toLowerCase();

            return SOURCE_LABELS[key] || capitalize(key);
        }

        function capitalize(str: string) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        const data = await SessionModel.aggregate([
            { $match: { siteId: { $in: sites } } },
            {
                $lookup: {
                    from: "conversions",
                    localField: "sessionId",
                    foreignField: "sessionId",
                    as: "conversions"
                }
            },
            {
                $group: {
                    _id: "$source",
                    visits: { $sum: 1 },
                    sales: {
                        $sum: { $size: "$conversions" }
                    },
                    revenue: {
                        $sum: {
                            $sum: "$conversions.value"
                        }
                    }
                }
            }
        ]);
        const totalVisits = data.reduce((acc, i) => acc + i.visits, 0) || 1;

        return data.map((item) => ({
            source: formatSource(item._id),
            visits: item.visits,
            visitsPercent: calculatePercentage(item.visits, totalVisits),
            sales: item.sales,
            revenue: item.revenue
        }));
    }

    static async funnel(userId: string, siteId?: string) {
        const sites = siteId
            ? [new Types.ObjectId(siteId)]
            : (await SiteModel.find({ ownerId: userId }).select('_id'))
                .map((s: IdItem) => s._id);

        const events = await EventModel.aggregate([
            { $match: { siteId: { $in: sites } } },
            { $group: { _id: { type: "$type", visitorId: "$visitorId" } } },
            { $group: { _id: "$_id.type", count: { $sum: 1 } } }
        ]);
        const purchases = await ConversionModel.countDocuments({
            siteId: { $in: sites }
        });

        const eventMap: Record<string, number> = {};
        events.forEach((e: EventItem) => {
            eventMap[e._id] = e.count;
        });
        eventMap["purchase"] = purchases;

        const stages = [
            "page_view",
            "scroll_25",
            "scroll_50",
            "scroll_75",
            "scroll_100",
            "cta_click",
            "checkout_start",
            "purchase"
        ];
        const base = eventMap["page_view"] || 1;

        return stages.map((stage) => {
            const count = eventMap[stage] || 0;
            return {
                stage,
                count,
                percent: calculatePercentage(count, base)
            };
        });
    }

    static async behavior(userId: string, siteId?: string) {
        const sites = siteId
            ? [new Types.ObjectId(siteId)]
            : (await SiteModel.find({ ownerId: userId }).select('_id'))
                .map((s: IdItem) => s._id);

        const sessions = await SessionModel.find({ siteId: { $in: sites } });
        const all = sessions.length;

        const totalDuration = sessions.reduce(
            (acc: number, s: ISessionDocument) =>
                acc + (s.lastActivityAt.getTime() - s.createdAt.getTime()),
            0
        );

        const avgTime = all
            ? Math.round(totalDuration / all / 1000)
            : 0;
        const scrollSessions = await EventModel.distinct("sessionId", {
            siteId: { $in: sites },
            type: /scroll/i
        });
        const scrollRate = calculatePercentage(scrollSessions.length, all);

        const ctaClicks = await EventModel.countDocuments({
            siteId: { $in: sites },
            type: "cta_click"
        });

        const pageViews = await EventModel.countDocuments({
            siteId: { $in: sites },
            type: "page_view"
        });

        const ctaRate = calculatePercentage(ctaClicks, pageViews);

        const bounce = sessions.filter(
            (s: ISessionDocument) =>
                s.lastActivityAt.getTime() - s.createdAt.getTime() < 15000
        ).length;

        const rejectionRate = calculatePercentage(bounce, all);

        const checkoutStart = await EventModel.countDocuments({
            siteId: { $in: sites },
            type: "checkout_start"
        });

        const purchases = await ConversionModel.countDocuments({
            siteId: { $in: sites }
        });

        const validPurchases = Math.min(purchases, checkoutStart);
        const checkoutAbandonment = checkoutStart
            ? calculatePercentage(checkoutStart - validPurchases, checkoutStart)
            : 0;

        return {
            averageTimeSeconds: avgTime,
            scrollRate,
            rejectionRate,
            ctaClicks,
            ctaRate,
            checkoutStart,
            checkoutAbandonment
        };
    }
}
