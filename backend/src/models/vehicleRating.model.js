import mongoose from "mongoose";

const vehicleRatingSchema = new mongoose.Schema(
    {
        vehicleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'VehicleInstance',
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Reference to the User model
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1, // Minimum rating value
            max: 5, // Maximum rating value
        },
        reviewText: {
            type: String,
            trim: true,
            maxlength: 500, // Limit review text to 500 characters
        },
    },
    {
        timestamps: true, // Enable timestamps (createdAt and updatedAt)
    }
);

vehicleRatingSchema.index({ vehicleId: 1, userId: 1 }, { unique: true });
vehicleRatingSchema.index({ vehicleId: 1, createdAt: -1 });

// Create the Mongoose model
const VehicleRating = mongoose.model('VehicleRating', vehicleRatingSchema);

export default VehicleRating;
