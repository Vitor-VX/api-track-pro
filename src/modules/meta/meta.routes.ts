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

const validatePurchase = [
    body("value").notEmpty().withMessage("value is required"),
    body("orderId").notEmpty().withMessage("orderId is required"),
    body("email").notEmpty().withMessage("email is required"),
    body("phone").notEmpty().withMessage("phone is required"),
    body("fbc").optional(),
    body("fbp").optional(),
    body("userAgent").optional(),
    body("clientIp").optional(),
];

router.post("/token/:siteId", jwtAuth, validateToken, validate, MetaController.saveToken);
router.get("/campaigns/:siteId", jwtAuth, MetaController.getCampaigns);
router.get("/summary/:siteId", jwtAuth, MetaController.getSummary);
router.post("/send-purchase/:siteId", jwtAuth, validatePurchase, validate, MetaController.sendPurchaseEvent);

export default router;
