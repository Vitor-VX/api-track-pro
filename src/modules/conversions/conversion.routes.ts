import { NextFunction, Request, Response, Router } from "express";
import { body, param, validationResult } from "express-validator";
import { ConversionController } from "./conversion.controller";
import { apiKeyAuth } from "../../middlewares/apiKey.middleware";
import { errorResponse } from "../../utils/response";

const router = Router();

const validateCreateConversion = [
  body("value").notEmpty().isNumeric(),
  body("currency").notEmpty().isString().trim(),
  body("event").notEmpty().isString().trim(),

  body("orderId").optional().isString(),

  body("fbc").optional().isString(),
  body("fbp").optional().isString(),

  body("utm").optional().isObject(),

  body("utm.utm_source").optional().isString(),
  body("utm.utm_medium").optional().isString(),
  body("utm.utm_campaign").optional().isString(),
  body("utm.utm_content").optional().isString(),
  body("utm.utm_term").optional().isString()
];

const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, "Validation failed", 400);
  }
  next();
};

router.post("/", apiKeyAuth, validateCreateConversion, validate, ConversionController.create);

export default router;
