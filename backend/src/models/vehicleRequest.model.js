import mongoose from "mongoose";

const vehicleUpdateRequestSchema = mongoose.Schema({
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "VehicleInstance",
        required: true,
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    requestMessage: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "approved", "review"],
        default: "pending",
    },
    requestType: {
        type: String,
        enum: ["Update", "Delete", "Report","Add"]
    }
}, {
    timestamps: true
});

vehicleUpdateRequestSchema.index({ status: 1, createdAt: -1 });
vehicleUpdateRequestSchema.index({ vehicleId: 1, status: 1 });

const VehicleRequest = mongoose.model("VehicleRequest", vehicleUpdateRequestSchema);

export default VehicleRequest;
