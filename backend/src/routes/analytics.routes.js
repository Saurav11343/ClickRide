import { Router } from "express";
import {
  getAdminAnalytics,
  getBookingStats,
  getPartnerAnalytics,
} from "../controllers/analytics.controller.js";
import { protectRoute, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/booking-stats", protectRoute, requireRole("Admin"), getBookingStats);
router.get("/getAdminAnalytics", protectRoute, requireRole("Admin"), getAdminAnalytics);
router.get("/getPartnerAnalytics", protectRoute, requireRole("Partner"), getPartnerAnalytics);

export default router;
