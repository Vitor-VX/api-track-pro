import { Document, Types } from "mongoose";

export interface IEvent {
  siteId: Types.ObjectId;
  sessionId: string;
  visitorId: string;
  type: string;
  source: string;
  data: Record<string, unknown>;
  createdAt: Date;
}

export interface IEventDocument extends IEvent, Document {}
