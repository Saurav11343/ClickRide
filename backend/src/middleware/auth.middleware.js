import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../models/user.model.js";
import { AppError, asyncHandler } from "./error.middleware.js";

export const protectRoute = asyncHandler(async (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) throw new AppError(401, "Authentication required");

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new AppError(401, "Invalid or expired session");
  }

  const user = await User.findById(decoded.userId)
    .select("-password")
    .populate("roleId", "roleName");

  if (!user) throw new AppError(401, "User no longer exists");

  req.user = user;
  req.userRole = user.roleId?.roleName;
  next();
});

export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.userRole || !allowedRoles.includes(req.userRole)) {
    return next(new AppError(403, "Forbidden"));
  }
  return next();
};
