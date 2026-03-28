import { NextFunction, Request, Response } from "express";
import SiteModel from "../modules/sites/site.model";
import { errorResponse } from "../utils/response";
import { MESSAGES } from "../constants/messages";

declare global {
  namespace Express {
    interface Request { site?: unknown; }
  }
}

export const apiKeyAuth = async (req: Request, res: Response, next: NextFunction) => {
  const siteId = req.query.siteId as string;
  const secret = req.query.secret as string;

  if (!siteId || !secret) return errorResponse(res, MESSAGES.apiKeyMissing, 401);

  const site = await SiteModel.findOne({ _id: siteId, apiKey: secret });
  if (!site) return errorResponse(res, MESSAGES.invalidApiKey, 401);

  req.site = site;
  next();
};