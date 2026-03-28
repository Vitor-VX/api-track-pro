import { Schema, connection } from "mongoose";

const conversionSchema = new Schema({
  siteId: { type: Schema.Types.ObjectId, ref: "Site", required: true },
  value: { type: Number, required: true },
  currency: { type: String, required: true },
  event: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

conversionSchema.index({ siteId: 1, orderId: 1 }, { unique: true, partialFilterExpression: { orderId: { $exists: true } } });

const ConversionModel = connection.useDb("track-backend").model("Conversion", conversionSchema);
export default ConversionModel;
