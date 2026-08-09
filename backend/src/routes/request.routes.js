import express from "express"
import { verifiedVehicle, cancelledVehicle, fetchAllVehicleRequest } from "../controllers/request.controller.js"
import { protectRoute, requireRole } from "../middleware/auth.middleware.js"
const router = express.Router()
router.post("/verifiedVehicle", protectRoute, requireRole("Admin"), verifiedVehicle)
router.post("/cancelledVehicle", protectRoute, requireRole("Admin"), cancelledVehicle)
router.get("/fetchAllVehicleRequest", protectRoute, requireRole("Admin"), fetchAllVehicleRequest)

export default router;
