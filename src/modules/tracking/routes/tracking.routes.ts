import { NextFunction, Request, Response, Router } from "express";
import { body, validationResult } from "express-validator";
import { TrackingController } from "../controllers/tracking.controller";
import { errorResponse } from "../../../utils/response";
import cors from "cors";

const router = Router();

const trackCors = cors({
  origin: "*",
  credentials: false
});

router.use(trackCors);
router.options("*", trackCors);

const validateTracking = [
  body("siteId").notEmpty().withMessage("Site ID is required").isString(),
  body("visitorId").notEmpty().withMessage("Visitor ID is required").isString(),
  body("sessionId").notEmpty().withMessage("Session ID is required").isString(),
  body("type").notEmpty().withMessage("Type is required").isString().trim(),
  body("data").optional().isObject(),
  body("source").notEmpty().withMessage("Source is required").isString().trim(),
  body("utm").optional().isObject()
];

const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, "Validation failed", 400);
  }
  next();
};

router.post("/", validateTracking, validate, TrackingController.track);

export default router;
