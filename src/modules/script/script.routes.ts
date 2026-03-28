import { NextFunction, Request, Response, Router } from "express";
import { query, validationResult } from "express-validator";
import { ScriptController } from "./script.controller";
import { errorResponse } from "../../utils/response";
import SiteModel from "../sites/site.model";

const router = Router();

const validateScript = [
  query("siteId").notEmpty().withMessage("Site ID is required").isMongoId().withMessage("Site ID must be a valid Mongo ID")
];

const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, "Validation failed", 400);
  }
  next();
};

const validateSiteInDatabase = async (req: Request, res: Response, next: NextFunction) => {
  const siteId = req.query.siteId as string;
  const site = await SiteModel.findById(siteId).select("_id");
  if (!site) {
    return errorResponse(res, "Site not found", 404);
  } 
  next();
};

router.get("/tracker.js", validateScript, validate, validateSiteInDatabase, ScriptController.serve);

export default router;
