import { Schema, connection, model } from "mongoose";
import { IEventDocument } from "../interfaces/event.interface";

const eventSchema = new Schema<IEventDocument>({
  siteId: { type: Schema.Types.ObjectId, ref: "Site", required: true },
  sessionId: { type: String, required: true },
  visitorId: { type: String, required: true },
  type: { type: String, required: true },
  source: { type: String, required: true },
  data: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
});

const EventModel = connection.useDb("track-backend").model<IEventDocument>("Event", eventSchema, "tracking_events");
export default EventModel;
