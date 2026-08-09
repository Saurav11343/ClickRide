import mongoose from "mongoose";
import * as Yup from "yup";
import { AppError, asyncHandler } from "../middleware/error.middleware.js";
import VehicleRating from "../models/vehicleRating.model.js";
import {
  deleteReviewSchema,
  editReviewSchema,
  fetchReviewSchema,
  reviewSchema,
} from "../validators/review.validator.js";

const validate = async (schema, data) => {
  try {
    return await schema.validate(data, { abortEarly: false, stripUnknown: true });
  } catch (error) {
    if (error instanceof Yup.ValidationError) {
      throw new AppError(400, "Validation failed", error.errors);
    }
    throw error;
  }
};

const findOwnedReview = async (reviewId, userId) => {
  const review = await VehicleRating.findById(reviewId);
  if (!review) throw new AppError(404, "Review not found");
  if (!review.userId.equals(userId)) throw new AppError(403, "Forbidden");
  return review;
};

export const addReview = asyncHandler(async (req, res) => {
  const input = await validate(reviewSchema, {
    ...req.body,
    userId: req.user._id.toString(),
  });

  const review = await VehicleRating.create(input);
  res.status(201).json(review);
});

export const editReview = asyncHandler(async (req, res) => {
  const input = await validate(editReviewSchema, req.body);
  const review = await findOwnedReview(input.reviewId, req.user._id);

  if (input.rating !== undefined) review.rating = input.rating;
  if (input.reviewText !== undefined) review.reviewText = input.reviewText;
  await review.save();

  res.status(200).json(review);
});

export const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = await validate(deleteReviewSchema, req.body);
  const review = await findOwnedReview(reviewId, req.user._id);
  await review.deleteOne();
  res.status(200).json({ message: "Review deleted successfully" });
});

export const fetchReview = asyncHandler(async (req, res) => {
  const { vehicleId } = await validate(fetchReviewSchema, req.body);
  const reviews = await VehicleRating.find({ vehicleId })
    .populate("userId", "email profilePic firstName lastName")
    .sort({ createdAt: -1 });
  res.status(200).json(reviews);
});

export const vehicleRating = asyncHandler(async (req, res) => {
  const { vehicleId } = await validate(fetchReviewSchema, req.body);
  const [rating] = await VehicleRating.aggregate([
    { $match: { vehicleId: new mongoose.Types.ObjectId(vehicleId) } },
    {
      $group: {
        _id: "$vehicleId",
        avgRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    avgRating: rating?.avgRating?.toFixed(1) || "0.0",
    totalReviews: rating?.totalReviews || 0,
  });
});
