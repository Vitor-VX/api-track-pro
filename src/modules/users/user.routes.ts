import { Router } from "express";
import { UserController } from "./user.controller";
import { jwtAuth } from "../../middlewares/auth.middleware";

const router = Router();
router.get("/me", jwtAuth, UserController.profile);

export default router;
