import { Schema, connection } from "mongoose";

const integrationSchema = new Schema({
  provider: { type: String, required: true },
  connected: { type: Boolean, default: false },
  accessToken: { type: String },
  accountId: { type: String },
  settings: { type: Schema.Types.Mixed }
}, { _id: false });

const siteSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  domain: { type: String, required: true },
  apiKey: { type: String, required: true, unique: true },
  trackerEnabled: { type: Boolean, default: true },
  integrations: { type: [integrationSchema], default: [] }
}, { timestamps: true });

const SiteModel = connection.useDb("track-backend").model("Site", siteSchema, "sites");
export default SiteModel;