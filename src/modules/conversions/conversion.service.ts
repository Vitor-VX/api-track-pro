import ConversionModel from "./conversion.model";
import { AppError } from "../../errors/AppError";
import { MESSAGES } from "../../constants/messages";

export class ConversionService {
  static async create(
    siteId: string,
    value: number,
    currency: string,
    event: string,
    extras?: {
      orderId?: string;
      fbc?: string;
      fbp?: string;
      utm?: {
        utm_source?: string;
        utm_medium?: string;
        utm_campaign?: string;
        utm_content?: string;
        utm_term?: string;
      };
    }
  ) {
    if (!siteId || value == null || !currency || !event) {
      throw new AppError(MESSAGES.missingFields, 400);
    }

    const conversion = await ConversionModel.create({
      siteId,
      value,
      currency,
      event,
      orderId: extras?.orderId,
      fbc: extras?.fbc,
      fbp: extras?.fbp,
      utm: extras?.utm
    });

    return conversion;
  }
}