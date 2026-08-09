import { Router } from "express";
import {
  addReview,
  deleteReview,
  editReview,
  fetchReview,
  vehicleRating,
} from "../controllers/review.controller.js";
import { protectRoute, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/vehicleRating", vehicleRating);
router.post("/fetchReview", protectRoute, fetchReview);
router.post("/addReview", protectRoute, requireRole("Customer"), addReview);
router.post("/editReview", protectRoute, requireRole("Customer"), editReview);
router.post("/deleteReview", protectRoute, requireRole("Customer"), deleteReview);

export default router;
