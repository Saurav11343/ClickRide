import { Router } from "express";
import {
  checkAuth,
  login,
  logout,
  signup,
  totalUser,
  updatePassword,
  updateProfile,
} from "../controllers/auth.controller.js";
import { addPreDefinedRole } from "../controllers/role.controller.js";
import { protectRoute, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", protectRoute, logout);
router.get("/check", protectRoute, checkAuth);
router.put("/updateProfile", protectRoute, updateProfile);
router.post("/updatePassword", protectRoute, updatePassword);
router.get("/users", protectRoute, requireRole("Admin"), totalUser);
router.post("/role", protectRoute, requireRole("Admin"), addPreDefinedRole);

export default router;
