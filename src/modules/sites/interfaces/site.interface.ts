import { Document } from "mongoose";

export interface ISite {
  ownerId: string;
  name: string;
  domain: string;
  apiKey: string;
  trackerEnabled: boolean;
  metaConnected: boolean;
}

export interface ISiteDocument extends ISite, Document {}
