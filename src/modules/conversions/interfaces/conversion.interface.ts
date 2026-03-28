import { Document } from "mongoose";

export interface IConversion {
  siteId: string;
  sessionId: string;
  value: number;
  currency: string;
  event: string;
  orderId?: string;
  createdAt: Date;
}

export interface IConversionDocument extends IConversion, Document {}
