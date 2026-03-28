import { Request, Response, NextFunction } from "express";
import { MetricsService } from "./metrics.service";
import { successResponse } from "../../utils/response";
import { IUserDocument } from "../users/interfaces/user.interface";

export class MetricsController {
  static async dashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as IUserDocument;
      const result = await MetricsService.globalDashboard(user._id as string);
      return successResponse(res, "Dashboard loaded", result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async overview(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as IUserDocument;
      const result = await MetricsService.overviewDashboard(user._id as string);
      return successResponse(res, "Overview loaded", result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async site(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = req.user as IUserDocument;
      const result = await MetricsService.siteMetrics(user._id as string, id);
      return successResponse(res, "Site metrics loaded", result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async performance(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = req.user as IUserDocument;
      const result = await MetricsService.performanceLast7Days(user._id as string, id);
      return successResponse(res, "Performance loaded", result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async source(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = req.user as IUserDocument;
      const result = await MetricsService.sourceTraffic(user._id as string, id);
      return successResponse(res, "Source traffic loaded", result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async funnel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = req.user as IUserDocument;
      const result = await MetricsService.funnel(user._id as string, id);
      return successResponse(res, "Funnel data loaded", result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async behavior(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = req.user as IUserDocument;
      const result = await MetricsService.behavior(user._id as string, id);
      return successResponse(res, "Behavior loaded", result, 200);
    } catch (error) {
      next(error);
    }
  }
}
