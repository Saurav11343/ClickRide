import { Router } from "express";
import { createOrder, verifyPayment } from "../controllers/payment.controller.js";
import { protectRoute, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protectRoute, requireRole("Customer"));
router.post("/create-order", createOrder);
router.post("/verify-payment", verifyPayment);

export default router;
