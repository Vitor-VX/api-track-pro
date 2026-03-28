import { Document } from "mongoose";

export interface ISiteIntegration {
  provider: string;
  connected: boolean;
  accessToken?: string;
  accountId?: string;
  settings?: Record<string, unknown>;
}

export interface ISite {
  ownerId: string;
  name: string;
  domain: string;
  apiKey: string;
  trackerEnabled: boolean;
  integrations?: ISiteIntegration[];
}

export interface ISiteDocument extends ISite, Document { }
