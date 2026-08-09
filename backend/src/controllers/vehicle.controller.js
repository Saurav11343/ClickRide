import cloudinary from "../lib/cloudinary.js";
import crypto from "crypto";
import VehicleInstance from "../models/vehicleInstance.model.js";
import VehicleModel from "../models/vehicleModel.model.js";
import VehicleUpdateRequest from "../models/vehicleRequest.model.js";
import VehicleImages from "../models/vehicleImages.model.js";
import { getFileNameFromUrl } from "../lib/utils.js";
import VehicleLocation from "../models/vehicleLocation.model.js";
import Booking from "../models/booking.model.js";

const canManageVehicle = (req, vehicle) =>
    req.userRole === "Admin" || vehicle.owner?.equals(req.user._id);


// export const addVehicle = async (req, res) => {
//     try {
//         const {
//             vehicleType,
//             vehicleMake,
//             vehicleModel,
//             vehicleSeat,
//             vehicleTransmission,
//             vehicleFuelType,
//             pricePerDay,
//             pricePerHour,
//             vehicleRegNumber,
//             manufacturingYear,
//             vehiclePic,
//             modelPic, // This will be base64 image or URL
//             availabilityStatus,
//             owner,
//         } = req.body;

//         // Validate required fields
//         if (
//             !vehicleType ||
//             !vehicleMake ||
//             !vehicleModel ||
//             !vehicleSeat ||
//             !vehicleTransmission ||
//             !vehicleFuelType ||
//             !pricePerDay ||
//             !pricePerHour ||
//             !vehicleRegNumber ||
//             !manufacturingYear ||
//             !availabilityStatus ||
//             !vehiclePic ||
//             !owner
//         ) {
//             return res.status(400).json({ message: "All vehicle details are required" });
//         }
//         let model = await VehicleModel.findOne({
//             vehicleType,
//             vehicleMake,
//             vehicleModel,
//         });

//         let uploadedModelPicUrl = modelPic;
//         if (!model && modelPic && !modelPic.startsWith("http")) {
//             const uploadedModelPic = await cloudinary.uploader.upload(modelPic, {
//                 folder: "vehicle_model_pictures",
//                 quality: "auto:low",
//                 width: 800,
//                 height: 600,
//                 crop: "fit",
//                 format: "webp",
//             });
//             uploadedModelPicUrl = uploadedModelPic.secure_url;
//         }


//         if (!model) {
//             model = new VehicleModel({
//                 vehicleType,
//                 vehicleMake,
//                 vehicleModel,
//                 modelPic: uploadedModelPicUrl,
//             });
//             await model.save();

//         }

//         // Ensure model ID is valid
//         if (!model || !model._id) {
//             return res.status(500).json({ message: "Vehicle model reference is invalid" });
//         }

//         // Check for an existing vehicle with the same registration number
//         const existingVehicle = await VehicleInstance.findOne({ vehicleRegNumber });


//         if (existingVehicle) {
//             return res.status(400).json({
//                 message: "Vehicle with this registration number already exists",
//             });
//         }


//         let uploadedPicUrl = vehiclePic;
//         if (vehiclePic && !vehiclePic.startsWith("http")) {
//             const uploadedPic = await cloudinary.uploader.upload(vehiclePic, {
//                 folder: "vehicle_pictures",
//                 quality: "auto:low",
//                 width: 800,
//                 height: 600,
//                 crop: "fit",
//                 format: "webp",
//             });
//             uploadedPicUrl = uploadedPic.secure_url;
//         }

//         // Create a new VehicleInstance
//         const newVehicleInstance = new VehicleInstance({
//             modelID: model._id, // Reference to the VehicleModel
//             vehicleRegNumber,
//             manufacturingYear,
//             vehiclePic: uploadedPicUrl,
//             availabilityStatus,
//             vehicleSeat,
//             vehicleTransmission,
//             vehicleFuelType,
//             pricePerDay,
//             pricePerHour,
//             owner,
//         });


//         // Save the vehicle instance
//         await newVehicleInstance.save();

//         // Populate the model reference
//         const populatedVehicleInstance = await newVehicleInstance.populate("modelID");
//         // Respond with the newly created vehicle instance
//         res.status(201).json({
//             success: true,
//             vehicle: populatedVehicleInstance,
//         });
//     } catch (error) {


//         if (error.name === "ValidationError") {
//             return res.status(400).json({
//                 message: "Validation Error",
//                 errors: error.errors,
//             });
//         }

//         res.status(500).json({ message: "An error occurred while adding the vehicle" });
//     }
// };

export const updateModelPic = async (req, res) => {
    try {
        const { modelPic, modelID } = req.body;

        // Validate inputs
        if (!modelPic) {
            return res.status(400).json({ message: "Vehicle picture is required" });
        }

        if (!modelID) {
            return res.status(400).json({ message: "Vehicle model ID is required" });
        }

        const model = await VehicleModel.findById(modelID);
        if (!model) {
            return res.status(404).json({ message: "Vehicle model not found" });
        }

        if (model.modelPic) {
            const publicId = getFileNameFromUrl(model.modelPic);
            if (publicId) {
                await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
            }
        }

        const uploadResponse = await cloudinary.uploader.upload(modelPic, {
            folder: "vehicle_model_pictures",
            quality: "auto:low",
            width: 800,
            height: 600,
            crop: "fit",
            format: "webp",
        });

        const updatedVehicleModel = await VehicleModel.findByIdAndUpdate(
            modelID,
            { modelPic: uploadResponse.secure_url },
            { new: true }
        );

        if (!updatedVehicleModel) {
            return res.status(404).json({ message: "Vehicle model not found" });
        }

        return res.status(200).json({
            message: "Vehicle model picture updated successfully",
            updatedVehicleModel
        });

    } catch (error) {
        console.error("Error in updateModelPic function:", error.message);
    return res.status(500).json({ message: "Internal server error" });
    }
};


export const totalVehicle = async (req, res) => {
    try {
        // Fetch only verified and available vehicles
        const vehicles = await VehicleInstance.find({
            verify: true,  // Only fetch verified vehicles
        })
            .populate('modelID')
            .populate('vehicleImagesId');

        // Count the vehicles
        const totalVehicles = vehicles.length;

        res.status(200).json({
            totalVehicles,
            vehicleDetails: vehicles,
        });
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


export const vehicleData = async (req, res) => {
    try {
        // Fetch all vehicles
        const vehicles = await VehicleInstance.findById(req.params.id).populate('modelID').populate('vehicleImagesId').populate('vehicleLocationId').populate({
            path: 'owner',
            select: 'email roleId',
            populate: {
                path: 'roleId',
                select: 'roleName'
            },

        });;


        res.status(200).json({
            vehicleDetails: vehicles,
        });
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const updateVehicleData = async (req, res) => {
    try {
        const {
            vehicleID,
            vehicleSeat,
            vehicleTransmission,
            vehicleFuelType,
            selectedImgs,
            vehicleRegNumber,
            manufacturingYear,
            pricePerDay,
            pricePerHour,
            availabilityStatus,
            vehicleAddress,
            latitude,
            longitude,
            country,
            state,
            city,
            pincode
        } = req.body;

        const vehicle = await VehicleInstance.findById(vehicleID);
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        if (!canManageVehicle(req, vehicle)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        let VehicleImage = null;
        if (vehicle.vehicleImagesId) {
            VehicleImage = await VehicleImages.findById(vehicle.vehicleImagesId);
            if (VehicleImage) {
                const imageFields = [
                    VehicleImage.VehicleFrontPic,
                    VehicleImage.VehicleBackPic,
                    VehicleImage.VehicleSide1Pic,
                    VehicleImage.VehicleSide2Pic
                ];

                for (let i = 0; i < imageFields.length; i++) {
                    const imageUrl = imageFields[i];
                    if (imageUrl) {
                        const publicId = getFileNameFromUrl(imageUrl);
                        if (publicId) {
                            await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
                        }
                    }
                }
            }
        }

        let uploadedImagesUrls = [];
        if (selectedImgs && selectedImgs.length > 0) {
            for (let i = 0; i < selectedImgs.length; i++) {
                const imageUrl = selectedImgs[i];
                if (!imageUrl.startsWith("http")) {
                    const uploadedPic = await cloudinary.uploader.upload(imageUrl, {
                        folder: "vehicle_pictures",
                        quality: "auto:low",
                        width: 800,
                        height: 600,
                        crop: "fit",
                        format: "webp",
                    });
                    uploadedImagesUrls.push(uploadedPic.secure_url);
                } else {
                    uploadedImagesUrls.push(imageUrl);
                }
            }

        } else {
        }

        if (uploadedImagesUrls.length > 0) {
            if (VehicleImage) {
                VehicleImage.VehicleFrontPic = uploadedImagesUrls[0] || VehicleImage.VehicleFrontPic;
                VehicleImage.VehicleBackPic = uploadedImagesUrls[1] || VehicleImage.VehicleBackPic;
                VehicleImage.VehicleSide1Pic = uploadedImagesUrls[2] || VehicleImage.VehicleSide1Pic;
                VehicleImage.VehicleSide2Pic = uploadedImagesUrls[3] || VehicleImage.VehicleSide2Pic;

                // Saving the updated instance
                await VehicleImage.save();  // Save the updated vehicle image instance
            } else {
                const newVehicleImages = new VehicleImages({
                    VehicleFrontPic: uploadedImagesUrls[0],
                    VehicleBackPic: uploadedImagesUrls[1],
                    VehicleSide1Pic: uploadedImagesUrls[2],
                    VehicleSide2Pic: uploadedImagesUrls[3],
                });

                const savedVehicleImages = await newVehicleImages.save();



                vehicle.vehicleImagesId = savedVehicleImages._id;
            }
        } else {
        }

        // Update vehicle location details
        if (vehicle.vehicleLocationId) {
            await VehicleLocation.findByIdAndUpdate(
                vehicle.vehicleLocationId,
                { vehicleAddress, latitude, longitude, country, state, city, pincode },
                { new: true }
            );
        }
        const updatedVehicle = await VehicleInstance.findOneAndUpdate(
            { _id: vehicleID },
            {
                vehicleSeat,
                vehicleTransmission,
                vehicleFuelType,
                vehicleRegNumber,
                manufacturingYear,
                pricePerDay,
                pricePerHour,
                availabilityStatus,
                vehicleImagesId: VehicleImages ? VehicleImages._id : savedVehicleImages._id
            },
            { new: true }
        ).populate('modelID').populate('vehicleImagesId');
        if (!updatedVehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        res.status(200).json({
            vehicleDetails: updatedVehicle,
        });
    } catch (error) {
        console.error('Error updating vehicle data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// export const deleteVehicleData = async (req, res) => {
//     try {
//         const { vehicleID } = req.body;

//         // Fetch vehicle instance
//         const vehicle = await VehicleInstance.findById(vehicleID);
//         if (!vehicle) {
//             return res.status(404).json({ error: "Vehicle instance not found" });
//         }

//         // Delete the vehicle's image from Cloudinary if it exists
//         if (vehicle.vehiclePic) {
//             const publicId = getFileNameFromUrl(vehicle.vehiclePic);
//             if (publicId) {
//                 try {
//                     await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
//                 } catch (cloudinaryError) {
//                     console.warn("Failed to delete vehicle image from Cloudinary:", cloudinaryError);
//                 }
//             }
//         }

//         // Delete all update requests related to the vehicle
//         await VehicleUpdateRequest.deleteMany({ vehicleId: vehicleID });

//         // Delete the vehicle instance
//         const deletedVehicle = await VehicleInstance.findByIdAndDelete(vehicleID);
//         if (!deletedVehicle) {
//             return res.status(500).json({ error: "Failed to delete vehicle instance" });
//         }

//         // Respond with success message
//         res.status(200).json({
//             message: "Vehicle instance and all associated update requests deleted successfully",
//             deletedVehicle,
//         });
//     } catch (error) {
//         console.error("Error deleting vehicle instance:", error);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// };

export const deleteVehicleData = async (req, res) => {
    try {
        const { vehicleID } = req.body;  // Vehicle ID received from the request

        // Validate the vehicleID
        if (!vehicleID || typeof vehicleID !== "string") {
            return res.status(400).json({ error: "Invalid vehicle ID provided" });
        }

        // Fetch vehicle instance based on vehicleId
        const vehicle = await VehicleInstance.findOne({ _id: vehicleID });
        if (!vehicle) {
            return res.status(404).json({ error: "Vehicle instance not found" });
        }
        if (!canManageVehicle(req, vehicle)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        // Handle image deletion if the vehicle has an associated vehicleImagesId
        let vehicleImageDeletionSuccess = true;
        if (vehicle.vehicleImagesId) {
            try {
                const VehicleImage = await VehicleImages.findById(vehicle.vehicleImagesId);
                if (VehicleImage) {
                    const imageFields = [
                        VehicleImage.VehicleFrontPic,
                        VehicleImage.VehicleBackPic,
                        VehicleImage.VehicleSide1Pic,
                        VehicleImage.VehicleSide2Pic
                    ];

                    // Delete the images from Cloudinary
                    for (let i = 0; i < imageFields.length; i++) {
                        const imageUrl = imageFields[i];
                        if (imageUrl) {
                            const publicId = getFileNameFromUrl(imageUrl);
                            if (publicId) {
                                await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
                            }
                        }
                    }

                    // After deleting images from Cloudinary, delete the VehicleImage document
                    await VehicleImages.findByIdAndDelete(vehicle.vehicleImagesId);
                }
            } catch (error) {
                vehicleImageDeletionSuccess = false;
            }
        }

        // If vehicle image deletion failed, prevent proceeding further
        if (!vehicleImageDeletionSuccess) {
            return res.status(500).json({ error: "Failed to delete associated vehicle images" });
        }

        // Delete the associated vehicle update requests
        const deletedUpdateRequests = await VehicleUpdateRequest.deleteMany({ vehicleId: vehicleID });

        const deleteLocation = await VehicleLocation.findByIdAndDelete(vehicle.vehicleLocationId);
        if (!deleteLocation) {
            return res.status(500).json({ error: "Failed to delete vehicle Location" });
        }
        // Delete the vehicle instance based on vehicleId
        const deletedVehicle = await VehicleInstance.findByIdAndDelete(vehicleID);
        if (!deletedVehicle) {
            return res.status(500).json({ error: "Failed to delete vehicle instance" });
        }

        // Respond with success message
        res.status(200).json({
            message: "Vehicle instance and associated data deleted successfully",
            deletedVehicle,
        });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};




export const totalVehicleModel = async (req, res) => {
    try {
        // Fetch all vehicle models
        const vehicleModels = await VehicleModel.find({});

        // Count the models
        const totalVehicleModels = vehicleModels.length;

        res.status(200).json({
            totalVehicleModels,
            vehicleModelDetails: vehicleModels,
        });
    } catch (error) {
        console.error('Error fetching vehicle models:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const deleteModelData = async (req, res) => {
    try {
        const { modelID } = req.body;

        // Validate modelID
        if (!modelID) {
            return res.status(400).json({ message: "Model ID is required" });
        }

        // Check if any vehicle instance exists with the given model ID
        const vehicleInstances = await VehicleInstance.find({ modelID });

        if (vehicleInstances.length > 0) {
            return res.status(400).json({
                message: "Cannot delete this model because there are vehicle instances referencing it.",
            });
        }

        // Find the model before deletion
        const model = await VehicleModel.findById(modelID);
        if (!model) {
            return res.status(404).json({ message: "Vehicle model not found" });
        }

        // Delete associated image from Cloudinary if it exists
        if (model.modelPic) {
            const publicId = getFileNameFromUrl(model.modelPic);
            if (publicId) {
                await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
            }
        }

        // Delete the model from the database
        const deletedModel = await VehicleModel.findByIdAndDelete(modelID);
        if (!deletedModel) {
            return res.status(404).json({ message: "Vehicle model not found" });
        }

        // Return success response
        return res.status(200).json({
            message: "Vehicle model deleted successfully",
            deletedModel,
        });
    } catch (error) {
        console.error("Error deleting vehicle model:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const vehicelupdaterequest = async (req, res) => {
    try {
        const {
            requestId,
            vehicleId,
            requestMessage,
            status,
            requestType,
        } = req.body;

        if (
            !vehicleId ||
            !requestMessage ||
            !status ||
            !requestType
        ) {
            return res.status(400).json({ message: "All details are required" });
        }

        const vehicle = await VehicleInstance.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({ error: "Vehicle instance not found" });
        }
        if (!canManageVehicle(req, vehicle)) {
            return res.status(403).json({ error: "Forbidden" });
        }
        const requestedBy = req.user._id;

        // If requestId exists, update the existing request
        if (requestId) {
            const existingRequest = await VehicleUpdateRequest.findById(requestId);
            if (!existingRequest) {
                return res.status(404).json({ error: "Update request not found" });
            }

            // Update fields of the existing request
            existingRequest.requestedBy = requestedBy;
            existingRequest.requestMessage = requestMessage;
            existingRequest.status = status;
            existingRequest.requestType = requestType;

            // Save the updated request
            await existingRequest.save();

            // Optional: You can also update the vehicle status if necessary
            vehicle.availabilityStatus = "Unavailable";
            await vehicle.save();

            const populatedUpdateRequest = await existingRequest.populate('vehicleId');

            return res.status(200).json({
                message: "Vehicle Update Request updated successfully",
                success: true,
                UpdateRequest: populatedUpdateRequest,
            });
        } else {
            // If no requestId, create a new update request
            const newUpdateRequest = new VehicleUpdateRequest({
                vehicleId: vehicleId,
                requestedBy,
                requestMessage,
                status,
                requestType,
            });

            await newUpdateRequest.save();

            vehicle.availabilityStatus = "Unavailable";
            await vehicle.save();

            const populatedUpdateRequest = await newUpdateRequest.populate('vehicleId');

            return res.status(201).json({
                message: "Vehicle Update Request sent successfully",
                success: true,
                UpdateRequest: populatedUpdateRequest,
            });
        }
    } catch (error) {
        console.error("Error sending Vehicle Update Request: ", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const vehicleDeleteRequest = async (req, res) => {
    try {
        const { requestID } = req.body;

        if (!requestID) {
            return res.status(400).json({ message: "Request ID is required" });
        }

        const request = await VehicleUpdateRequest.findOne({ _id: requestID });

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        const requestVehicle = await VehicleInstance.findById(request.vehicleId);
        if (!requestVehicle || !canManageVehicle(req, requestVehicle)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const vehicleID = request.vehicleId;

        const deletedRequest = await VehicleUpdateRequest.findOneAndDelete({ _id: requestID });

        if (!deletedRequest) {
            return res.status(404).json({ message: "Failed to delete request" });
        }

        const pendingOrReviewRequests = await VehicleUpdateRequest.countDocuments({
            vehicleId: vehicleID,
            status: { $in: ["pending", "review"] },
        });

        if (pendingOrReviewRequests === 0) {
            await VehicleInstance.findByIdAndUpdate(vehicleID, { availabilityStatus: "Available" });
        }
        return res.status(200).json({
            success: true,
            message: "Request deleted successfully",
            deletedRequest,
        });
    } catch (error) {
        console.error("Error deleting request:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export const vehicelPendingUpdateRequestData = async (req, res) => {
    try {


        const requestFilter = req.userRole === "Admin" ? {} : { requestedBy: req.user._id };
        const totalUpdateRequestData = await VehicleUpdateRequest.find(requestFilter)
            .populate({
                path: "vehicleId",
                select: "vehicleRegNumber owner vehicleImagesId",
                populate: {
                    path: "vehicleImagesId",
                    select: "VehicleFrontPic VehicleBackPic VehicleSide1Pic VehicleSide2Pic", // Adjust the fields you need
                },
            })
            .populate({
                path: "requestedBy",
                select: "email",
                populate: {
                    path: "roleId",
                    select: "roleName",
                },
            });

        // Send response
        res.status(200).json({
            totalUpdateRequest: totalUpdateRequestData.length,
            totalUpdateResponce: totalUpdateRequestData,
        });

    } catch (error) {
        console.error("Error fetching vehicle update request:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const updateRequestStatus = async (req, res) => {
    try {
        const { requestID, status, vehicleID } = req.body;
        if (!requestID || !status || !vehicleID) {
            return res.status(400).json({ success: false, message: "Missing required request fields" });
        }

        // Update the request status
        const updatedRequest = await VehicleUpdateRequest.findOneAndUpdate(
            { _id: requestID },
            { status },
            { new: true } // Returns the updated document
        );

        if (!updatedRequest) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }
        // Find the vehicle
        const vehicle = await VehicleInstance.findById(vehicleID);
        if (!vehicle) {
            return res.status(404).json({ success: false, message: "Vehicle not found" });
        }
        // Check for existing requests with "pending" or "review" status for the same vehicle
        const existingRequests = await VehicleUpdateRequest.find({
            vehicleId: vehicleID,
            status: { $in: ["pending", "review"] }
        });

        // If there are existing requests in "pending" or "review", prevent setting the vehicle as "Available"
        if (existingRequests.length > 0) {
            if (status === "approved") {
                vehicle.availabilityStatus = "Unavailable";
            }
        } else {
            // If there are no pending/review requests, we can set the vehicle as "Available" for approved requests
            if (status === "approved") {
                vehicle.availabilityStatus = "Available";
            }
        }

        // For other status types (pending, review), set the vehicle availability as "Unavailable"
        const statusMapping = {
            pending: "Unavailable",
            review: "Unavailable",
        };

        // Ensure we don't overwrite the "approve" logic if we already set the availability
        if (status !== "approved" && statusMapping[status]) {
            vehicle.availabilityStatus = statusMapping[status];
        }

        // Save vehicle status update
        await vehicle.save(); // Save only once
        return res.status(200).json({
            success: true,
            message: "Request status updated successfully",
            updatedRequest,
            vehicle,
        });

    } catch (error) {
        console.error("Error updating request status:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const acceptRequest = async (req, res) => {
    try {
        const { requestID } = req.body;

        if (!requestID) {
            return res.status(400).json({ message: "Request ID is required" });
        }

        const request = await VehicleUpdateRequest.findOne({ _id: requestID });

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        const vehicleID = request.vehicleId;

        const deletedRequest = await VehicleUpdateRequest.findOneAndDelete({ _id: requestID });

        if (!deletedRequest) {
            return res.status(404).json({ message: "Failed to delete request" });
        }

        const pendingOrReviewRequests = await VehicleUpdateRequest.countDocuments({
            vehicleId: vehicleID,
            status: { $in: ["pending", "review"] },
        });

        if (pendingOrReviewRequests === 0) {
            await VehicleInstance.findByIdAndUpdate(vehicleID, { availabilityStatus: "Available" });
        }
        return res.status(200).json({
            success: true,
            message: "Request deleted successfully",
            deletedRequest,
        });
    } catch (error) {
        console.error("Error deleting request:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// export const reactAddVehicle = async (req, res) => {
//     try {
//         const {
//             vehicleType,
//             vehicleMake,
//             vehicleModel,
//             vehicleSeat,
//             vehicleTransmission,
//             vehicleFuelType,
//             pricePerDay,
//             pricePerHour,
//             vehicleRegNumber,
//             manufacturingYear,
//             vehiclePic,
//             modelPic, // This will be base64 image or URL
//             availabilityStatus,
//             owner,
//         } = req.body;

//         // Check each variable and return success or error message
//         if (!vehicleType) {
//             return res.status(400).json({ message: "Vehicle type is required from backend." });
//         } else {
//             console.log("Vehicle type provided:", vehicleType);
//         }

//         if (!vehicleMake) {
//             return res.status(400).json({ message: "Vehicle make is required." });
//         } else {
//             console.log("Vehicle make provided:", vehicleMake);
//         }

//         if (!vehicleModel) {
//             return res.status(400).json({ message: "Vehicle model is required." });
//         } else {
//             console.log("Vehicle model provided:", vehicleModel);
//         }
//         if (!vehiclePic) {
//             return res.status(400).json({ message: "Vehicle picture is required." });
//         } else {
//             console.log("Vehicle picture provided:  yes !!!!!");
//         }
//         if (!vehicleSeat) {
//             return res.status(400).json({ message: "Number of seats is required." });
//         } else {
//             console.log("Number of seats provided:", vehicleSeat);
//         }

//         if (!vehicleTransmission) {
//             return res.status(400).json({ message: "Vehicle transmission is required." });
//         } else {
//             console.log("Vehicle transmission provided:", vehicleTransmission);
//         }

//         if (!vehicleFuelType) {
//             return res.status(400).json({ message: "Vehicle fuel type is required." });
//         } else {
//             console.log("Vehicle fuel type provided:", vehicleFuelType);
//         }
//         if (!vehicleRegNumber) {
//             return res.status(400).json({ message: "Vehicle registration number is required." });
//         } else {
//             console.log("Vehicle registration number provided:", vehicleRegNumber);
//         }

//         if (!manufacturingYear) {
//             return res.status(400).json({ message: "Manufacturing year is required." });
//         } else {
//             console.log("Manufacturing year provided:", manufacturingYear);
//         }

//         if (!pricePerDay) {
//             return res.status(400).json({ message: "Price per day is required." });
//         } else {
//             console.log("Price per day provided:", pricePerDay);
//         }

//         if (!pricePerHour) {
//             return res.status(400).json({ message: "Price per hour is required." });
//         } else {
//             console.log("Price per hour provided:", pricePerHour);
//         }




//         if (!modelPic) {
//             return res.status(400).json({ message: "Model picture is required." });
//         } else {
//             console.log("Model picture provided:", modelPic);
//         }

//         if (!availabilityStatus) {
//             return res.status(400).json({ message: "Availability status is required." });
//         } else {
//             console.log("Availability status provided:", availabilityStatus);
//         }

//         if (!owner) {
//             return res.status(400).json({ message: "User ID is required." });
//         } else {
//             console.log("User ID provided:", owner);
//         }


//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: "Server error" });
//     }
// };
export const addVehicle = async (req, res) => {
    try {

        const {
            vehicleType,
            vehicleMake,
            vehicleModel,
            vehicleSeat,
            vehicleTransmission,
            vehicleFuelType,
            pricePerDay,
            pricePerHour,
            vehicleRegNumber,
            manufacturingYear,
            vehiclePics,
            modelPic,
            owner: requestedOwner,
            vehicleAddress,
            latitude,
            longitude,
            country,
            state,
            city,
            pincode,
            vehicleDocument,
        } = req.body;
        const userRole = req.userRole;
        const owner = userRole === "Partner" ? req.user._id : requestedOwner;

        if (
            !vehicleType ||
            !vehicleMake ||
            !vehicleModel ||
            !vehicleSeat ||
            !vehicleTransmission ||
            !vehicleFuelType ||
            !pricePerDay ||
            !pricePerHour ||
            !vehicleRegNumber ||
            !manufacturingYear ||
            !owner ||
            !vehiclePics || vehiclePics.length !== 4 ||
            !vehicleAddress ||
            !latitude ||
            !longitude ||
            !country ||
            !state ||
            !city ||
            !pincode ||
            !vehicleDocument
        ) {
            console.log("Validation failed: Missing required fields.");
            return res.status(400).json({ message: "All vehicle details are required, including exactly 4 vehicle pictures and location details." });
        }

        const existingVehicle = await VehicleInstance.findOne({ vehicleRegNumber });
        if (existingVehicle) {
            return res.status(400).json({ message: "Vehicle with this registration number already exists" });
        }

        // Determine vehicle availability and verification based on userRole
        let isVerified = false;
        let vehicleAvailabilityStatus = "Unavailable";

        if (userRole === "Admin") {
            isVerified = true;
            vehicleAvailabilityStatus = "Available";
        }

        console.log("Uploading vehicle images...");
        let uploadedPicsUrls = [];
        for (const pic of vehiclePics) {
            if (pic && !pic.startsWith("http")) {
                try {
                    const uploadedPic = await cloudinary.uploader.upload(pic, {
                        folder: "vehicle_pictures",
                        quality: "auto:low",
                        width: 800,
                        height: 600,
                        crop: "fit",
                        format: "webp",
                    });
                    uploadedPicsUrls.push(uploadedPic.secure_url);
                } catch (error) {
                    console.error("Error uploading vehicle image:", error);
                }
            } else {
                uploadedPicsUrls.push(pic);
            }
        }

        console.log("Saving vehicle images in the database...");
        const newVehicleImages = new VehicleImages({
            VehicleFrontPic: uploadedPicsUrls[0],
            VehicleBackPic: uploadedPicsUrls[1],
            VehicleSide1Pic: uploadedPicsUrls[2],
            VehicleSide2Pic: uploadedPicsUrls[3],
        });
        await newVehicleImages.save();

        console.log("Checking for existing vehicle model...");
        let model = await VehicleModel.findOne({ vehicleType, vehicleMake, vehicleModel });
        let uploadedModelPicUrl = modelPic;

        if (!model && modelPic && !modelPic.startsWith("http")) {
            try {
                console.log("Uploading model picture...");
                const uploadedModelPic = await cloudinary.uploader.upload(modelPic, {
                    folder: "vehicle_model_pictures",
                    quality: "auto:low",
                    width: 800,
                    height: 600,
                    crop: "fit",
                    format: "webp",
                });
                uploadedModelPicUrl = uploadedModelPic.secure_url;
            } catch (error) {
                console.error("Error uploading model picture:", error);
            }
        }

        if (!model) {
            console.log("Saving new vehicle model...");
            model = new VehicleModel({
                vehicleType,
                vehicleMake,
                vehicleModel,
                modelPic: uploadedModelPicUrl,
            });
            await model.save();
        }

        if (!model || !model._id) {
            console.log("Vehicle model reference is invalid.");
            return res.status(500).json({ message: "Vehicle model reference is invalid" });
        }

        console.log("Uploading vehicle document...");
        let uploadedVehicleDocumentUrl = vehicleDocument;
        if (vehicleDocument && !vehicleDocument.startsWith("http")) {
            try {
                const uploadedDocument = await cloudinary.uploader.upload(vehicleDocument, {
                    folder: "vehicle_documents",
                    resource_type: "raw",
                    use_filename: true,
                    // format: "pdf",
                });
                uploadedVehicleDocumentUrl = uploadedDocument.secure_url;
            } catch (error) {
                console.error("Error uploading vehicle document:", error);
                return res.status(500).json({ message: "Error uploading vehicle document" });
            }
        }

        console.log("Saving vehicle location in the database...");
        const newVehicleLocation = new VehicleLocation({
            vehicleAddress,
            latitude,
            longitude,
            country,
            state,
            city,
            pincode,
        });
        await newVehicleLocation.save();

        console.log("Saving vehicle instance in the database...");
        const newVehicleInstance = new VehicleInstance({
            modelID: model._id,
            vehicleRegNumber,
            manufacturingYear,
            availabilityStatus: vehicleAvailabilityStatus,
            vehicleSeat,
            vehicleTransmission,
            vehicleFuelType,
            pricePerDay,
            pricePerHour,
            owner,
            vehicleImagesId: newVehicleImages._id,
            vehicleLocationId: newVehicleLocation._id,
            vehicleDocument: uploadedVehicleDocumentUrl,
            verified: isVerified, // ✅ Save verification status dynamically
        });

        await newVehicleInstance.save();

        // If user is a Partner, create a verification request
        if (userRole === "Partner") {
            const verificationRequest = new VehicleUpdateRequest({
                vehicleId: newVehicleInstance._id,
                requestedBy: owner,
                requestMessage: "Verification for Vehicle Addition",
                requestType: "Add",
                status: "pending"
            });
            await verificationRequest.save();
        }

        console.log("Fetching populated vehicle instance...");
        const populatedVehicleInstance = await newVehicleInstance.populate("modelID vehicleImagesId vehicleLocationId");

        res.status(201).json({
            success: true,
            vehicle: populatedVehicleInstance,
            images: uploadedPicsUrls,
            document: uploadedVehicleDocumentUrl,
        });
    } catch (error) {
        console.error("An error occurred while adding the vehicle:", error);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: "Validation Error",
                errors: error.errors,
            });
        }

        res.status(500).json({ message: "An error occurred while adding the vehicle" });
    }
};


export const bookingVehicle = async (req, res) => {
    try {
        const {
            vehicleID,
            firstName,
            lastName,
            email,
            phone,
            startDateTime,
            endDateTime,
            accessories,
            totalPrice,
        } = req.body;
        const userID = req.user._id;

        // Validate required fields
        if (!userID || !vehicleID || !startDateTime || !endDateTime || !totalPrice) {
            console.error("Validation failed: Missing required fields");
            return res.status(400).json({ success: false, message: "All required fields must be filled!" });
        }

        const start = new Date(startDateTime);
        const end = new Date(endDateTime);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
            return res.status(400).json({ success: false, message: "Booking dates are invalid" });
        }

        // Atomically reserve the vehicle so concurrent requests cannot double-book it.
        const vehicle = await VehicleInstance.findOneAndUpdate(
            { _id: vehicleID, availabilityStatus: "Available", verify: true },
            { availabilityStatus: "Booked" },
            { new: true },
        );

        if (!vehicle) {
            return res.status(400).json({ success: false, message: "This vehicle is already booked. Please choose another one." });
        }

        // Generate a 6-digit OTP
        const otp = crypto.randomInt(100000, 1000000).toString();

        // Convert accessories object into an array of selected options
        const selectedAccessories = accessories
            ? Object.entries(accessories)
                .filter(([_, value]) => value)
                .map(([key]) => key)
            : [];

        // Create a new booking entry
        const newBooking = new Booking({
            userID,
            vehicleID,
            startDateTime: start,
            endDateTime: end,
            accessories: selectedAccessories,
            totalPrice,
            status: "Booked",
            otp,
        });

        // Save booking to the database
        let savedBooking;
        try {
            savedBooking = await newBooking.save();
        } catch (error) {
            await VehicleInstance.findByIdAndUpdate(vehicleID, { availabilityStatus: "Available" });
            throw error;
        }

        return res.status(201).json({
            success: true,
            message: "Your booking was successful! Please verify your OTP.",
            booking: savedBooking,
        });

    } catch (error) {
        console.error("Booking failed:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while processing your booking. Please try again.",
            error: "Internal Server Error",
        });
    }
};



export const cancelBooking = async (req, res) => {
    try {
        const { bookingID } = req.body;

        // Validate required fields
        if (!bookingID) {
            console.error("Invalid Booking ID");
            return res.status(400).json({ success: false, message: "Invalid booking ID" });
        }

        // Check if the booking exists
        const booking = await Booking.findById(bookingID);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found!" });
        }
        if (!booking.userID.equals(req.user._id)) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }

        // Fetch the associated vehicle using vehicleID from booking
        const vehicle = await VehicleInstance.findById(booking.vehicleID);
        if (!vehicle) {
            return res.status(404).json({ success: false, message: "Associated vehicle not found!" });
        }

        // Update booking status to "Cancelled"
        booking.status = "Cancelled";
        await booking.save();

        // Update vehicle status to "Available"
        vehicle.availabilityStatus = "Available";
        await vehicle.save();

        return res.status(200).json({
            success: true,
            message: "Your booking has been successfully canceled, and the vehicle is now available.",
        });

    } catch (error) {
        console.error("Booking cancellation failed:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while canceling the booking. Please try again.",
        error: "Internal Server Error"
        });
    }
};



// export const getVehicleHistory = async (req, res) => {
//     try {
//         const { userID } = req.body; // Expecting userID from the request body

//         if (!userID) {
//             return res.status(400).json({ success: false, message: "UserId is required" });
//         }

//         // Fetch bookings for the given userID
//         const bookings = await Booking.find({ userID })
//             .sort({ createdAt: -1 }) // Sort by latest bookings first
//             .populate({
//                 path: "userID",
//                 select: "-password -mustChangePassword" // Exclude sensitive user fields
//             })
//             .populate({
//                 path: "vehicleID",
//                 populate: {
//                     path: "modelID vehicleImagesId vehicleLocationId" // Populate modelID inside vehicleID
//                 }
//             });

//         return res.status(200).json({
//             success: true,
//             totalBookings: bookings.length, // Total number of bookings
//             bookingDetails: bookings // Booking details
//         });

//     } catch (error) {
//         console.error("Error fetching vehicle history:", error);
//         return res.status(500).json({ success: false, message: "Internal Server Error" });
//     }
// };


export const getVehicleHistory = async (req, res) => {
    try {
        const userID = req.user._id;
        const role = req.userRole;

        if (!role) return res.status(403).json({ success: false, message: "Forbidden" });

        let bookings;

        if (role === "Customer") {
            // Fetch bookings where the user is the customer
            bookings = await Booking.find({ userID })
                .sort({ createdAt: -1 })
                .populate({
                    path: "userID",
                    select: "-password -mustChangePassword"
                })
                .populate({
                    path: "vehicleID",
                    populate: {
                        path: "modelID vehicleImagesId vehicleLocationId owner"
                    }
                });

        } else if (role === "Partner" || role === "Admin") {
            // Find all vehicle instances owned by this partner
            const partnerVehicles = await VehicleInstance.find({ owner: userID }).select("_id");

            if (!partnerVehicles.length) {
                return res.status(404).json({ success: false, message: "No vehicles found for this partner" });
            }

            const vehicleIds = partnerVehicles.map(vehicle => vehicle._id); // Extract vehicle IDs

            // Fetch all bookings related to these vehicles
            bookings = await Booking.find({ vehicleID: { $in: vehicleIds } })
                .sort({ createdAt: -1 })
                .populate({
                    path: "userID",
                    select: "-password -mustChangePassword"
                })
                .populate({
                    path: "vehicleID",
                    populate: {
                        path: "modelID vehicleImagesId vehicleLocationId owner"
                    }
                });

        } else {
            return res.status(400).json({ success: false, message: "Invalid role" });
        }

        return res.status(200).json({
            success: true,
            totalBookings: bookings.length,
            bookingDetails: bookings
        });

    } catch (error) {
        console.error("Error fetching vehicle history:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

