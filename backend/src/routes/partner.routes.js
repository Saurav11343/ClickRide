import { Router } from "express";
import {
  deletePartnerRequest,
  partnerRequest,
  partnerSignup,
  validatePartnerRequest,
} from "../controllers/partner.controller.js";
import { protectRoute, requireRole } from "../middleware/auth.middleware.js";

const router = Router();
const adminOnly = [protectRoute, requireRole("Admin")];

router.post("/partnerSignup", partnerSignup);
router.get("/partnerRequest", ...adminOnly, partnerRequest);
router.post("/deletePartnerRequest", ...adminOnly, deletePartnerRequest);
router.post("/validatePartnerRequest", ...adminOnly, validatePartnerRequest);

export default router;
