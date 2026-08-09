import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import authRoutes from "./routes/auth.routes.js";
import bookRoutes from "./routes/book.routes.js";
import partnerRoutes from "./routes/partner.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import requestRoutes from "./routes/request.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import vehicleRoutes from "./routes/vehicle.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { readinessHandler, requireDatabase } from "./middleware/readiness.middleware.js";

export const createApp = () => {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "50mb" }));
  app.use(cookieParser());
  app.use(cors({ origin: env.clientUrl, credentials: true }));

  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", uptime: Math.floor(process.uptime()) });
  });
  app.get("/api/ready", readinessHandler);
  app.use("/api", requireDatabase);

  app.use("/api/auth", authRoutes);
  app.use("/api/vehicle", vehicleRoutes);
  app.use("/api/partner", partnerRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/review", reviewRoutes);
  app.use("/api/book", bookRoutes);
  app.use("/api/request", requestRoutes);
  app.use("/api/payment", paymentRoutes);
  app.use("/api", notFoundHandler);

  if (env.isProduction) {
    const frontendDirectory = path.resolve("frontend", "dist");
    app.use(express.static(frontendDirectory));
    app.get("*", (req, res) => {
      res.sendFile(path.join(frontendDirectory, "index.html"));
    });
  }

  app.use(errorHandler);
  return app;
};
