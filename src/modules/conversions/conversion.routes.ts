import { NextFunction, Request, Response, Router } from "express";
import { body, param, validationResult } from "express-validator";
import { ConversionController } from "./conversion.controller";
import { apiKeyAuth } from "../../middlewares/apiKey.middleware";
import { errorResponse } from "../../utils/response";

const router = Router();

const validateCreateConversion = [
  body("value").notEmpty().withMessage("Value is required").isNumeric().withMessage("Value must be numeric"),
  body("currency").notEmpty().withMessage("Currency is required").isString().trim(),
  body("event").notEmpty().withMessage("Event is required").isString().trim()
];

const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, "Validation failed", 400);
  }
  next();
};

router.post("/",apiKeyAuth, validateCreateConversion, validate, ConversionController.create);

export default router;
