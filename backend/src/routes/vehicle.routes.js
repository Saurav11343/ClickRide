import { Router } from "express";
import {
  addVehicle,
  bookingVehicle,
  cancelBooking,
  deleteModelData,
  deleteVehicleData,
  getVehicleHistory,
  totalVehicle,
  totalVehicleModel,
  updateModelPic,
  updateRequestStatus,
  updateVehicleData,
  vehicleData,
  vehicleDeleteRequest,
  vehicelPendingUpdateRequestData,
  vehicelupdaterequest,
} from "../controllers/vehicle.controller.js";
import { protectRoute, requireRole } from "../middleware/auth.middleware.js";

const router = Router();
const fleetManager = [protectRoute, requireRole("Admin", "Partner")];

router.get("/vehicles", totalVehicle);
router.get("/vehiclesModel", totalVehicleModel);
router.get("/vehicles/:id", vehicleData);

router.post("/addVehicle", ...fleetManager, addVehicle);
router.put("/updateModelPic", ...fleetManager, updateModelPic);
router.post("/updatevehicle", ...fleetManager, updateVehicleData);
router.post("/deleteVehicle", ...fleetManager, deleteVehicleData);
router.post("/vehicleUpdateRequest", ...fleetManager, vehicelupdaterequest);
router.post("/vehicleDeleteRequest", ...fleetManager, vehicleDeleteRequest);
router.get("/vehicelPendingUpdateRequestData", ...fleetManager, vehicelPendingUpdateRequestData);
router.post("/updateRequestStatus", protectRoute, requireRole("Admin"), updateRequestStatus);
router.post("/DeleteModel", protectRoute, requireRole("Admin"), deleteModelData);

router.post("/bookingVehicle", protectRoute, requireRole("Customer"), bookingVehicle);
router.post("/viewHistory", protectRoute, getVehicleHistory);
router.post("/cancelBooking", protectRoute, requireRole("Customer"), cancelBooking);

export default router;
