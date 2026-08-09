import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDB, disconnectDB } from "./lib/db.js";
import { logger } from "./lib/logger.js";
import { startBookingStatusJob, stopBookingStatusJob } from "./lib/updateVehicleStatus.Cron.js";

const app = createApp();
let server;
let shuttingDown = false;

const startServer = async () => {
  server = app.listen(env.port, () => {
    logger.info("HTTP server listening", { port: env.port });
  });

  try {
    await connectDB();
    startBookingStatusJob();
    logger.info("Application ready");
  } catch (error) {
    logger.error("Application startup failed", { error: error.message });
    await shutdown("STARTUP_FAILURE", 1);
  }
};

const shutdown = async (signal, exitCode = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info("Application shutting down", { signal });

  stopBookingStatusJob();
  if (server) await new Promise((resolve) => server.close(resolve));
  await disconnectDB();
  process.exit(exitCode);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (error) => {
  logger.error("Unhandled promise rejection", { error: error?.message });
});
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { error: error.message });
  shutdown("UNCAUGHT_EXCEPTION", 1);
});

startServer();
