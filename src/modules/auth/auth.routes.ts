import cors from "cors";
import { NextFunction, Request, Response, Router } from "express";
import { body, validationResult } from "express-validator";
import { AuthController } from "./auth.controller";
import { errorResponse } from "../../utils/response";

const router = Router();

const validateRegister = [
    body("name").notEmpty().withMessage("Name is required").isString().trim(),
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
];

const validateLogin = [
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required")
];

const validate = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return errorResponse(res, "Validation failed", 400);
    }
    next();
};

router.post("/register", validateRegister, validate, AuthController.register);
router.post("/login", validateLogin, validate, AuthController.login);

export default router;