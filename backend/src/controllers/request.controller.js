import { AppError, asyncHandler } from "../middleware/error.middleware.js";
import VehicleInstance from "../models/vehicleInstance.model.js";
import VehicleRequest from "../models/vehicleRequest.model.js";

const findRequest = async (requestId) => {
  if (!requestId) throw new AppError(400, "Request ID is required");
  const request = await VehicleRequest.findById(requestId);
  if (!request) throw new AppError(404, "Request not found");
  return request;
};

export const verifiedVehicle = asyncHandler(async (req, res) => {
  const request = await findRequest(req.body.requestId);
  const vehicle = await VehicleInstance.findById(request.vehicleId);
  if (!vehicle) throw new AppError(404, "Vehicle not found");

  vehicle.verify = true;
  vehicle.availabilityStatus = "Available";
  request.status = "approved";
  await Promise.all([vehicle.save(), request.save()]);

  res.status(200).json({ message: "Vehicle verified successfully" });
});

export const cancelledVehicle = asyncHandler(async (req, res) => {
  const request = await findRequest(req.body.requestId);
  const vehicle = await VehicleInstance.findById(request.vehicleId);
  if (!vehicle) throw new AppError(404, "Vehicle not found");

  await Promise.all([vehicle.deleteOne(), request.deleteOne()]);
  res.status(200).json({ message: "Vehicle request deleted successfully" });
});

export const fetchAllVehicleRequest = asyncHandler(async (req, res) => {
  const requests = await VehicleRequest.find({})
    .populate({ path: "vehicleId", populate: { path: "vehicleImagesId" } })
    .populate({ path: "requestedBy", select: "-password" })
    .sort({ createdAt: -1 });

  const counts = requests.reduce(
    (result, request) => ({
      ...result,
      [request.status]: (result[request.status] || 0) + 1,
    }),
    {},
  );

  res.status(200).json({
    success: true,
    totalRequests: requests.length,
    pendingRequests: counts.pending || 0,
    approvedRequests: counts.approved || 0,
    reviewRequests: counts.review || 0,
    requests,
  });
});
