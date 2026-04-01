import { Request, Response, NextFunction } from "express";
import { ConversionService } from "./conversion.service";
import { successResponse } from "../../utils/response";
import { ISiteDocument } from "../sites/interfaces/site.interface";

export class ConversionController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { value, currency, event, orderId, fbc, fbp, utm } = req.body;

      const site = req.site as ISiteDocument;

      const conversion = await ConversionService.create(
        site._id as string,
        value,
        currency,
        event,
        {
          orderId,
          fbc,
          fbp,
          utm
        }
      );

      return successResponse(res, "Conversion created", conversion, 201);
    } catch (error) {
      next(error);
    }
  }
}
