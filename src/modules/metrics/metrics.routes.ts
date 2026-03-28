import { Router } from "express";
import { MetricsController } from "./metrics.controller";
import { jwtAuth } from "../../middlewares/auth.middleware";

const router = Router();
router.get("/dashboard", jwtAuth, MetricsController.dashboard);
router.get("/overview", jwtAuth, MetricsController.overview);
router.get("/site/:id", jwtAuth, MetricsController.site);
router.get("/performance/:id?", jwtAuth, MetricsController.performance);
router.get("/source/:id", jwtAuth, MetricsController.source);
router.get("/funnel/:id", jwtAuth, MetricsController.funnel);
router.get("/behavior/:id", jwtAuth, MetricsController.behavior);

export default router;
