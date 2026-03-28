import { Request, Response, NextFunction } from "express";
import { SiteService } from "./site.service";
import { successResponse } from "../../utils/response";
import { AppError } from "../../errors/AppError";
import { MESSAGES } from "../../constants/messages";
import { IUserDocument } from "../users/interfaces/user.interface";

export class SiteController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, domain } = req.body;
      if (!name || !domain) {
        throw new AppError(MESSAGES.missingFields, 400);
      }
      const site = await SiteService.create((req.user as IUserDocument)._id, name, domain);
      return successResponse(res, "Site created", site, 201);
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const sites = await SiteService.list((req.user as IUserDocument)._id);
      return successResponse(res, "Sites loaded", sites, 200);
    } catch (error) {
      next(error);
    }
  }

  static async details(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const site = await SiteService.getDetails((req.user as IUserDocument)._id, id);
      return successResponse(res, "Site details", site, 200);
    } catch (error) {
      next(error);
    }
  }
}
