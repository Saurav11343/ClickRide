import * as Yup from 'yup';

export const reviewSchema = Yup.object().shape({
    vehicleId: Yup.string()
        .required('Vehicle ID is required'),
    userId: Yup.string()
        .required('User ID is required'),

    rating: Yup.number()
        .required('Rating is required')
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating cannot be more than 5'),

    reviewText: Yup.string()
        .required('Review text is required')
        .min(10, 'Review text must be at least 10 characters')
        .max(500, 'Review text cannot exceed 500 characters'),
});

export const editReviewSchema = Yup.object().shape({
    reviewId: Yup.string()
        .required('Review ID is required'),

    rating: Yup.number()
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating cannot be more than 5')
        .notRequired(), // Optional field

    reviewText: Yup.string()
        .min(10, 'Review text must be at least 10 characters')
        .max(500, 'Review text cannot exceed 500 characters')
        .notRequired(), // Optional field
});

export const deleteReviewSchema = Yup.object().shape({
    reviewId: Yup.string()
        .required('Review ID is required'),
});

export const fetchReviewSchema = Yup.object().shape({
    vehicleId: Yup.string()
        .required('Vehicle ID is required'),
});
