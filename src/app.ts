import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/users/user.routes";
import siteRoutes from "./modules/sites/site.routes";
import trackingRoutes from "./modules/tracking/routes/tracking.routes";
import conversionRoutes from "./modules/conversions/conversion.routes";
import metricsRoutes from "./modules/metrics/metrics.routes";
import metaRoutes from "./modules/meta/meta.routes";
import scriptRoutes from "./modules/script/script.routes";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/v1/track", trackingRoutes);
app.use("/api/v1/script", scriptRoutes);

app.use(cors({
    origin: process.env.URL_SITE,
    credentials: true
}));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/sites", siteRoutes);
app.use("/api/v1/conversion", conversionRoutes);
app.use("/api/v1/metrics", metricsRoutes);
app.use("/api/v1/meta", metaRoutes);

app.use(errorHandler);

export default app;
