import ConversionModel from "./conversion.model";
import { AppError } from "../../errors/AppError";
import { MESSAGES } from "../../constants/messages";

export class ConversionService {
  static async create(siteId: string, value: number, currency: string, event: string) {
    if (!siteId || value == null || !currency || !event) {
      throw new AppError(MESSAGES.missingFields, 400);
    }
    const conversion = await ConversionModel.create({ siteId, value, currency, event });
    return conversion;
  }
}