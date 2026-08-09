import mongoose from "mongoose";

export const readinessHandler = (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({
    status: ready ? "ready" : "starting",
  });
};

export const requireDatabase = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: "Service is starting",
      retryAfter: 3,
    });
  }
  return next();
};
