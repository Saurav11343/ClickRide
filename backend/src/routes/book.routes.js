import { Router } from "express";
import {
  checkBookmark,
  checkBookStatus,
  fetchAllBookmarks,
  setBookmark,
  unsetBookmark,
  unverifyRide,
  verifyRide,
} from "../controllers/book.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protectRoute);
router.post("/setBookmark", setBookmark);
router.post("/unsetBookmark", unsetBookmark);
router.post("/checkBookmark", checkBookmark);
router.post("/fetchAllBookmarks", fetchAllBookmarks);
router.post("/verifyRide", verifyRide);
router.post("/UnverifyRide", unverifyRide);
router.post("/checkBookStatus", checkBookStatus);

export default router;
