import SiteModel from "./site.model";
import { generateApiKey } from "../../utils";
import { AppError } from "../../errors/AppError";
import { MESSAGES } from "../../constants/messages";

export class SiteService {
  static async create(ownerId: string, name: string, domain: string) {
    const apiKey = generateApiKey();
    const site = await SiteModel.create({ ownerId, name, domain, apiKey, trackerEnabled: true, metaConnected: false });
    return site;
  }

  static async list(ownerId: string) {
    return SiteModel.find({ ownerId });
  }

  static async getDetails(ownerId: string, siteId: string) {
    const site = await SiteModel.findOne({ _id: siteId, ownerId }).select("-apiKey").select("-__v");
    if (!site) throw new AppError(MESSAGES.siteNotFound, 404);
        return site;
    }
}
