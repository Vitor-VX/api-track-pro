import { Schema, connection, model } from "mongoose";

const siteSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  domain: { type: String, required: true },
  apiKey: { type: String, required: true, unique: true },
  trackerEnabled: { type: Boolean, default: true },
  metaConnected: { type: Boolean, default: false }
}, { timestamps: true });

const SiteModel = connection.useDb("track-backend").model("Site", siteSchema, "sites");
export default SiteModel;
