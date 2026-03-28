import { AppError } from "../../../errors/AppError";
import { MESSAGES } from "../../../constants/messages";
import SessionModel from "../models/session.model";
import EventModel from "../models/event.model";

export interface ITrackingPayload {
  siteId: string;
  sessionId: string;
  visitorId: string;
  type: string;
  data: Record<string, unknown>;
  source: string;
  utm?: Record<string, unknown>;
}

export class TrackingService {
  static async track(payload: ITrackingPayload) {
    const { siteId, visitorId, sessionId, type, data, source, utm } = payload;
    if (type === "purchase") {
      throw new AppError("Purchase events are not allowed through tracking endpoint. Use conversions endpoint.", 400);
    }
    const session = await SessionModel.findOneAndUpdate(
      { siteId, sessionId },
      {
        $set: { source, utm: utm || {}, lastActivityAt: new Date() },
        $setOnInsert: { createdAt: new Date(), visitorId }
      },
      { upsert: true, new: true }
    );
    const event = await EventModel.create({ siteId, visitorId, sessionId, type, source, data: data || {} });
    return { session, event };
  }
}
