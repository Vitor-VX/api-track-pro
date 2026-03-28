import { NextFunction, Request, Response, Router } from "express";
import { body, param, validationResult } from "express-validator";
import { SiteController } from "./site.controller";
import { jwtAuth } from "../../middlewares/auth.middleware";
import { errorResponse } from "../../utils/response";

const router = Router();

const validateCreateSite = [
  body("name").notEmpty().withMessage("Name is required").isString().trim(),
  body("domain").notEmpty().withMessage("Domain is required").isString().trim()
];

const validateSiteId = [
  param("id").isMongoId().withMessage("Invalid site ID")
];

const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, "Validation failed", 400);
  }
  next();
};

router.post("/", jwtAuth, validateCreateSite, validate, SiteController.create);
router.get("/", jwtAuth, SiteController.list);
router.get("/:id", jwtAuth, validateSiteId, validate, SiteController.details);

export default router;
