import { Document, Types } from "mongoose";

export interface ISession {
  siteId: Types.ObjectId;
  visitorId: string;
  sessionId: string;
  source: string;
  utm: Record<string, unknown>;
  createdAt: Date;
  lastActivityAt: Date;
}

export interface ISessionDocument extends ISession, Document {}
