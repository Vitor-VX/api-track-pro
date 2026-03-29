import { NextFunction, Request, Response, Router } from "express";
import { body, validationResult } from "express-validator";
import { MetaController } from "./meta.controller";
import { errorResponse } from "../../utils/response";
import { jwtAuth } from "../../middlewares/auth.middleware";

const router = Router();

const validate = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return errorResponse(res, "Validation failed", 400);
    }
    next();
};

const validateToken = [
    body("accessToken").notEmpty().withMessage("accessToken is required"),
    body("pixelId").notEmpty().withMessage("pixelId is required")
];

router.post("/token/:siteId", jwtAuth, validateToken, validate, MetaController.saveToken);
router.get("/campaigns/:siteId", jwtAuth, MetaController.getCampaigns);
router.get("/summary/:siteId", jwtAuth, MetaController.getSummary);

export default router;
