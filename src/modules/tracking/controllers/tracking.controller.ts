import { Request, Response, NextFunction } from "express";
import { TrackingService } from "../services/tracking.service";
import { successResponse } from "../../../utils/response";
import { MESSAGES } from "../../../constants/messages";

export class TrackingController {
  static async track(req: Request, res: Response, next: NextFunction) {
    try {
      const { siteId, visitorId, sessionId, type, data, source, utm } = req.body;
      const result = await TrackingService.track({ siteId, visitorId, sessionId, type, data, source, utm });
      return successResponse(res, MESSAGES.success, result, 201);
    } catch (error) {
      next(error);
    }
  }
}