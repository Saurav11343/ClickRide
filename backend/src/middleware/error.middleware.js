import { logger } from "../lib/logger.js";

export class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({ message: "Route not found" });
};

export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  const statusCode = error.statusCode || 500;
  logger.error("Request failed", {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    error: error.message,
  });

  return res.status(statusCode).json({
    message: statusCode >= 500 ? "Internal server error" : error.message,
    ...(error.details ? { details: error.details } : {}),
  });
};
