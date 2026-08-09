import cron from "node-cron";
import Booking from "../models/booking.model.js";
import VehicleInstance from "../models/vehicleInstance.model.js";
import { logger } from "./logger.js";

let bookingStatusTask;

const updateExpiredBookings = async () => {
  try {
    const expiredBookings = await Booking.find({
      endDateTime: { $lte: new Date() },
      status: { $in: ["Booked", "Active"] },
    }).select("_id vehicleID");

    await Promise.all(
      expiredBookings.map(async ({ _id, vehicleID }) => {
        await Promise.all([
          VehicleInstance.findByIdAndUpdate(vehicleID, { availabilityStatus: "Available" }),
          Booking.findByIdAndUpdate(_id, { status: "Completed" }),
        ]);
      }),
    );

    if (expiredBookings.length > 0) {
      logger.info("Expired bookings completed", { count: expiredBookings.length });
    }
  } catch (error) {
    logger.error("Booking status job failed", { error: error.message });
  }
};

export const startBookingStatusJob = () => {
  if (!bookingStatusTask) {
    bookingStatusTask = cron.schedule("* * * * *", updateExpiredBookings);
  }
  return bookingStatusTask;
};

export const stopBookingStatusJob = () => {
  bookingStatusTask?.stop();
  bookingStatusTask = undefined;
};

export { updateExpiredBookings };
