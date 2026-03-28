import { NextFunction, Request, Response, Router } from "express";
import { query, validationResult } from "express-validator";
import { MetaController } from "./meta.controller";
import { errorResponse } from "../../utils/response";

const router = Router();

const validateConnect = [
    query("site_id").notEmpty().withMessage("site_id is required").isMongoId().withMessage("site_id must be a valid Mongo ID")
];

const validate = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return errorResponse(res, "Validation failed", 400);
    }
    next();
};

const validateCallback = [
    query("code").notEmpty().withMessage("code is required"),
    query("state").notEmpty().withMessage("state is required").isMongoId().withMessage("state must be a valid Mongo ID")
];

router.get("/connect", validateConnect, validate, MetaController.connect);
router.get("/callback", validateCallback, validate, MetaController.callback);

export default router;
