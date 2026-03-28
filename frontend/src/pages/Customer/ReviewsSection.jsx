import React, { useState, useEffect } from "react";
import { Star, Edit, Trash, X } from "lucide-react"; // Import Lucide icons
import { useForm, Controller } from "react-hook-form"; // React Hook Form
import { yupResolver } from "@hookform/resolvers/yup"; // Yup Resolver
import * as Yup from "yup"; // Yup Validation
import { useReviewStore } from "../../store/useReviewStore";
import { useAuthStore } from "../../store/useAuthStore";
import {
  reviewSchema,
  editReviewSchema,
} from "../../validators/review.validator";

const ReviewsSection = ({ vehicleID }) => {
  const [reviews, setReviews] = useState([]);
  const [editingReviewId, setEditingReviewId] = useState(null); // Track which review is being edited
  const { addReview, editReview, deleteReview, fetchReview } = useReviewStore();
  const { authUser, checkAuth } = useAuthStore();

  // React Hook Form for Adding a Review
  const {
    control: addReviewControl,
    handleSubmit: handleAddReviewSubmit,
    reset: resetAddReviewForm,
    formState: { errors: addReviewErrors },
  } = useForm({
    resolver: yupResolver(reviewSchema),
    defaultValues: {
      vehicleId: vehicleID,
      userId: authUser?._id,
      rating: 0,
      reviewText: "",
    },
  });

  // React Hook Form for Editing a Review
  const {
    control: editReviewControl,
    handleSubmit: handleEditReviewSubmit,
    reset: resetEditReviewForm,
    formState: { errors: editReviewErrors },
  } = useForm({
    resolver: yupResolver(editReviewSchema),
  });

  // Fetch reviews on component mount and after mutations
  const fetchReviews = async () => {
    try {
      const data = await fetchReview({ vehicleId: vehicleID });
      setReviews(data);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    }
  };

  useEffect(() => {
    checkAuth();
    fetchReviews();
  }, [checkAuth, vehicleID]);

  // Handle review submission
  const onSubmitAddReview = async (data) => {
    try {
      const newReviewData = await addReview(data);
      setReviews([...reviews, newReviewData]);
      resetAddReviewForm(); // Reset the form after submission
      fetchReviews(); // Refetch reviews
    } catch (error) {
      console.error("Failed to add review:", error);
    }
  };

  // Handle editing a review
  const onSubmitEditReview = async (data) => {
    try {
      const updatedReview = await editReview(data);
      setReviews(
        reviews.map((review) =>
          review._id === data.reviewId ? updatedReview : review,
        ),
      );
      setEditingReviewId(null); // Exit edit mode
      resetEditReviewForm(); // Reset the edit form
      fetchReviews(); // Refetch reviews
    } catch (error) {
      console.error("Failed to edit review:", error);
    }
  };

  // Handle deleting a review
  const handleDeleteReview = async (reviewId) => {
    try {
      await deleteReview({ reviewId });
      setReviews(reviews.filter((review) => review._id !== reviewId)); // Remove the deleted review
      fetchReviews(); // Refetch reviews
    } catch (error) {
      console.error("Failed to delete review:", error);
    }
  };

  // Enter edit mode for a review
  const enterEditMode = (review) => {
    setEditingReviewId(review._id);
    resetEditReviewForm({
      reviewId: review._id,
      rating: review.rating,
      reviewText: review.reviewText,
    });
  };

  // Exit edit mode
  const exitEditMode = () => {
    setEditingReviewId(null);
    resetEditReviewForm();
  };

  return (
    <div className=" mx-auto mt-8 bg-white rounded-2xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl border border-gray-100">
      <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4">
        Reviews & Feedback
      </h2>

      {/* Review Input */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-10 shadow-sm">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">
          Share Your Experience
        </h3>
        <form onSubmit={handleAddReviewSubmit(onSubmitAddReview)}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-gray-700 font-medium">Your Rating:</span>
            <Controller
              name="rating"
              control={addReviewControl}
              rules={{ required: "Rating is required" }}
              render={({ field }) => (
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      onClick={() => field.onChange(star)}
                      className={`cursor-pointer w-7 h-7 transition-all duration-300 transform hover:scale-110 ${
                        field.value >= star
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              )}
            />
          </div>
          {addReviewErrors.rating && (
            <p className="text-red-500 text-sm mb-2 ml-1">
              {addReviewErrors.rating.message}
            </p>
          )}

          <Controller
            name="reviewText"
            control={addReviewControl}
            rules={{ required: "Please share your thoughts" }}
            render={({ field }) => (
              <textarea
                {...field}
                className="w-full p-4 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-300 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                rows="4"
                placeholder="Share your experience with this vehicle..."
              />
            )}
          />

          {addReviewErrors.reviewText && (
            <p className="text-red-500 text-sm mt-1 ml-1">
              {addReviewErrors.reviewText.message}
            </p>
          )}

          <button
            type="submit"
            className="mt-4 bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1"
          >
            Submit Review
          </button>
        </form>
      </div>

      {/* Reviews List */}
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-6 text-gray-700">
          Customer Reviews
        </h3>

        <div className="max-h-[600px] overflow-y-auto space-y-8 pr-2 scrollbar-hide">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div
                key={review._id}
                className="border-b border-gray-100 pb-6 last:border-0 hover:bg-gray-50 p-4 rounded-lg transition-colors duration-200"
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-4">
                    {/* Profile Picture */}
                    <div className="relative">
                      <img
                        src={review.userId.profilePic || "/avatar.png"}
                        alt="User Profile"
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                      />
                    </div>

                    <div>
                      <p className="text-gray-800 font-medium">
                        {review.userId.firstName} {review.userId.lastName}
                      </p>
                      <div className="flex gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              review.rating >= star
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {authUser && authUser._id === review.userId._id && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => enterEditMode(review)}
                        className="text-gray-500 hover:text-blue-600 transition-colors duration-200 p-2 rounded-full hover:bg-blue-100"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteReview(review._id)}
                        className="text-gray-500 hover:text-red-600 transition-colors duration-200 p-2 rounded-full hover:bg-red-100"
                      >
                        <Trash className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                {editingReviewId === review._id ? (
                  // Edit Review Form
                  <form
                    onSubmit={handleEditReviewSubmit(onSubmitEditReview)}
                    className="mt-3 bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-gray-600 font-medium">Rating:</span>
                      <Controller
                        name="rating"
                        control={editReviewControl}
                        rules={{ required: "Rating is required" }}
                        render={({ field }) => (
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                onClick={() => field.onChange(star)}
                                className={`cursor-pointer w-6 h-6 transition-colors duration-200 ${
                                  field.value >= star
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      />
                    </div>

                    <Controller
                      name="reviewText"
                      control={editReviewControl}
                      rules={{ required: "Review text is required" }}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                          rows="3"
                          placeholder="Edit your review..."
                        />
                      )}
                    />

                    <div className="flex gap-3 mt-4">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300 text-sm font-medium"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={exitEditMode}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-all duration-300 flex items-center gap-1 text-sm font-medium"
                      >
                        <X className="w-4 h-4" /> Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  // Display Review
                  <>
                    <p className="text-gray-700 mt-3 leading-relaxed">
                      {review.reviewText}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </p>
                    </div>
                  </>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <div className="text-gray-400 mb-3">
                <Star className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-600 font-medium">No reviews yet</p>
              <p className="text-gray-500 mt-1">
                Be the first to share your experience!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewsSection;
