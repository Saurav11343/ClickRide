import mongoose from "mongoose";
import Booking from "../models/booking.model.js";
import Bookmark from "../models/bookmark.model.js";
import VehicleInstance from "../models/vehicleInstance.model.js";
import { AppError, asyncHandler } from "../middleware/error.middleware.js";

const requireObjectId = (value, label) => {
  if (!mongoose.isValidObjectId(value)) {
    throw new AppError(400, `${label} is invalid`);
  }
  return value;
};

const getBookmarkInput = (req) => ({
  userId: req.user._id,
  vehicleId: requireObjectId(req.body.vehicleId, "Vehicle ID"),
});

const getBooking = async (bookingId) => {
  requireObjectId(bookingId, "Booking ID");
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError(404, "Booking not found");
  return booking;
};

export const setBookmark = asyncHandler(async (req, res) => {
  const input = getBookmarkInput(req);
  const [vehicle, existingBookmark] = await Promise.all([
    VehicleInstance.exists({ _id: input.vehicleId }),
    Bookmark.findOne(input),
  ]);

  if (!vehicle) throw new AppError(404, "Vehicle not found");
  if (existingBookmark) throw new AppError(409, "Vehicle already bookmarked");

  const bookmark = await Bookmark.create(input);
  res.status(201).json({
    success: true,
    message: "Bookmark added successfully",
    bookmark,
  });
});

export const unsetBookmark = asyncHandler(async (req, res) => {
  const input = getBookmarkInput(req);
  const bookmark = await Bookmark.findOneAndDelete(input);
  if (!bookmark) throw new AppError(404, "Bookmark not found");

  res.status(200).json({ success: true, message: "Bookmark removed successfully" });
});

export const checkBookmark = asyncHandler(async (req, res) => {
  const bookmark = await Bookmark.exists(getBookmarkInput(req));
  res.status(200).json({ isBookmarked: Boolean(bookmark) });
});

export const fetchAllBookmarks = asyncHandler(async (req, res) => {
  const bookmarks = await Bookmark.find({ userId: req.user._id }).populate({
    path: "vehicleId",
    populate: [{ path: "modelID" }, { path: "vehicleImagesId" }],
  });

  res.status(200).json({ bookmarks });
});

export const verifyRide = asyncHandler(async (req, res) => {
  const booking = await getBooking(req.body.bookingId);
  if (booking.status === "Active") {
    return res.status(200).json({ message: "Booking is already active", booking });
  }
  if (booking.status !== "Booked") {
    throw new AppError(409, "Only booked rides can be activated");
  }

  booking.status = "Active";
  await booking.save();
  return res.status(200).json({ message: "Booking activated successfully", booking });
});

export const unverifyRide = asyncHandler(async (req, res) => {
  const booking = await getBooking(req.body.bookingId);
  if (booking.status !== "Active") {
    throw new AppError(409, "Only active rides can return to booked status");
  }

  booking.status = "Booked";
  await booking.save();
  res.status(200).json({ message: "Booking handover cancelled", booking });
});

export const checkBookStatus = asyncHandler(async (req, res) => {
  const booking = await getBooking(req.body.bookingId);
  res.status(200).json({ status: booking.status });
});

// Backward-compatible aliases for existing imports while call sites migrate.
export const setbookmark = setBookmark;
export const unsetbookmark = unsetBookmark;
export const UnverifyRide = unverifyRide;
