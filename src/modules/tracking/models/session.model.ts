import { Schema, connection, model } from "mongoose";
import { ISessionDocument } from "../interfaces/session.interface";

const sessionSchema = new Schema<ISessionDocument>({
  siteId: { type: Schema.Types.ObjectId, ref: "Site", required: true },
  visitorId: { type: String, required: true },
  sessionId: { type: String, required: true },
  source: { type: String, required: true },
  utm: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  lastActivityAt: { type: Date, default: Date.now }
});

sessionSchema.index({ siteId: 1, sessionId: 1 }, { unique: true });

const SessionModel = connection.useDb("track-backend").model<ISessionDocument>("Session", sessionSchema, "tracking_sessions");
export default SessionModel;
