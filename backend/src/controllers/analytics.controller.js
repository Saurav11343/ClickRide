import Booking from "../models/booking.model.js";
import VehicleInstance from "../models/vehicleInstance.model.js";
import VehicleRating from "../models/vehicleRating.model.js"
import VehicleModel from "../models/vehicleModel.model.js";
import User from "../models/user.model.js"
import mongoose from 'mongoose';

export const getBookingAnalytics = async (req, res) => {
    try {
        const { userId, role } = req.body; // Assuming extracted from JWT middleware

        let matchCondition = {}; // Default for admins (fetch all data)
        let ownVehicleCondition = { owner: userId }; // Condition to filter admin's own vehicles

        if (role === 'partner') {
            // Restrict data to partner's own vehicles
            const partnerVehicles = await VehicleInstance.find({ owner: userId }).select('_id');
            const partnerVehicleIds = partnerVehicles.map(v => v._id);
            matchCondition.vehicleID = { $in: partnerVehicleIds };
        }

        // Fetch global booking status distribution
        const statusStats = await Booking.aggregate([
            { $match: matchCondition },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalRevenue: { $sum: "$totalPrice" }
                }
            },
            {
                $project: {
                    status: "$_id",
                    count: 1,
                    totalRevenue: 1,
                    _id: 0
                }
            }
        ]);

        // Fetch vehicle utilization data
        const vehicles = await VehicleInstance.find(matchCondition).populate('modelID');
        const utilizationData = await Promise.all(vehicles.map(async (vehicle) => {
            const bookings = await Booking.find({
                vehicleID: vehicle._id,
                status: { $in: ['Booked', 'Active', 'Done'] }
            });

            const totalDays = 30; // Default monthly calculation
            const bookedDays = bookings.reduce((acc, booking) => {
                const diff = Math.ceil((booking.endDate - booking.startDate) / (1000 * 60 * 60 * 24));
                return acc + diff;
            }, 0);

            return {
                vehicleId: vehicle._id,
                model: vehicle.modelID.name,
                utilization: (bookedDays / totalDays * 100).toFixed(2),
                totalBookings: bookings.length,
                totalRevenue: bookings.reduce((acc, b) => acc + b.totalPrice, 0)
            };
        }));

        let ownVehicleStats = [];
        if (role === 'admin') {
            // Fetch admin's own vehicles separately
            const ownVehicles = await VehicleInstance.find(ownVehicleCondition).populate('modelID');
            ownVehicleStats = await Promise.all(ownVehicles.map(async (vehicle) => {
                const bookings = await Booking.find({
                    vehicleID: vehicle._id,
                    status: { $in: ['Booked', 'Active', 'Done'] }
                });

                const totalDays = 30;
                const bookedDays = bookings.reduce((acc, booking) => {
                    const diff = Math.ceil((booking.endDate - booking.startDate) / (1000 * 60 * 60 * 24));
                    return acc + diff;
                }, 0);

                return {
                    vehicleId: vehicle._id,
                    model: vehicle.modelID.name,
                    utilization: (bookedDays / totalDays * 100).toFixed(2),
                    totalBookings: bookings.length,
                    totalRevenue: bookings.reduce((acc, b) => acc + b.totalPrice, 0)
                };
            }));
        }

        res.status(200).json({
            success: true,
            statusStats,
            utilizationStats: utilizationData,
            ownVehicleStats: role === 'admin' ? ownVehicleStats : undefined
        });

    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Export Report Function
export const exportAnalyticsReport = async (req, res) => {
    try {
        const { userId, role } = req.body;

        let matchCondition = {};
        if (role === 'partner') {
            const partnerVehicles = await VehicleInstance.find({ owner: userId }).select('_id');
            const partnerVehicleIds = partnerVehicles.map(v => v._id);
            matchCondition.vehicleID = { $in: partnerVehicleIds };
        }

        const bookings = await Booking.find(matchCondition)
            .populate('vehicleID')
            .lean();

        const csvFields = ['Booking ID', 'Vehicle', 'Status', 'Start Date', 'End Date', 'Total Price'];
        const csvData = bookings.map(booking => ({
            'Booking ID': booking._id,
            'Vehicle': booking.vehicleID ? booking.vehicleID.name : 'Unknown',
            'Status': booking.status,
            'Start Date': booking.startDate.toISOString().split('T')[0],
            'End Date': booking.endDate.toISOString().split('T')[0],
            'Total Price': booking.totalPrice
        }));

        const csv = json2csv.parse(csvData, { fields: csvFields });

        res.header('Content-Type', 'text/csv');
        res.attachment('analytics_report.csv');
        res.send(csv);

    } catch (error) {
        console.error('Error exporting analytics report:', error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const getBookingAnalytics1 = async (req, res) => {
    try {
        const { userId, role } = req.body; // Assuming extracted from JWT middleware

        // Define the match condition for booking stats.
        // For partners, restrict data to their own vehicles; for admin, use all data.
        let matchCondition = {};
        if (role === 'partner') {
            const partnerVehicles = await VehicleInstance.find({ owner: userId }).select('_id');
            const partnerVehicleIds = partnerVehicles.map(v => v._id);
            matchCondition.vehicleID = { $in: partnerVehicleIds };
        }

        // Global booking status statistics
        const bookingStatusStats = await Booking.aggregate([
            { $match: matchCondition },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalRevenue: { $sum: "$totalPrice" }
                }
            },
            {
                $project: {
                    status: "$_id",
                    count: 1,
                    totalRevenue: 1,
                    _id: 0
                }
            }
        ]);

        // For utilization, fetch vehicles.
        // If the user is an admin, fetch all vehicles; otherwise, restrict to partner's vehicles.
        const vehicles = await VehicleInstance.find(role === 'admin' ? {} : matchCondition)
            .populate('modelID');

        // Calculate utilization for each vehicle.
        // Utilization is based on the number of days booked in a default 30-day month.
        const utilizationData = await Promise.all(vehicles.map(async (vehicle) => {
            const bookings = await Booking.find({
                vehicleID: vehicle._id,
                status: { $in: ['Booked', 'Active', 'Done'] }
            });

            const totalDays = 30; // Default monthly period for calculation
            const bookedDays = bookings.reduce((acc, booking) => {
                // Ensure dates are properly parsed as Date objects
                const diff = Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24));
                return acc + diff;
            }, 0);

            return {
                vehicleId: vehicle._id,
                owner: vehicle.owner, // Useful for grouping admin vs partner vehicles
                model: vehicle.modelID.name,
                utilization: parseFloat(((bookedDays / totalDays) * 100).toFixed(2)),
                totalBookings: bookings.length,
                totalRevenue: bookings.reduce((acc, b) => acc + b.totalPrice, 0)
            };
        }));

        // For admin users, separate utilization data into admin-owned and partner-owned vehicles.
        let adminVehicleUtilization = [];
        let partnerVehicleUtilization = [];
        if (role === 'admin') {
            adminVehicleUtilization = utilizationData.filter(data => data.owner.toString() === userId.toString());
            partnerVehicleUtilization = utilizationData.filter(data => data.owner.toString() !== userId.toString());
        }

        // Build the response structure.
        const responseData = {
            success: true,
            bookingStatusStats, // Data for charts like pie or bar charts by booking status
            utilizationStats: role === 'admin'
                ? {
                    allVehicles: utilizationData,       // Utilization for every vehicle
                    adminVehicles: adminVehicleUtilization, // Vehicles owned by the admin
                    partnerVehicles: partnerVehicleUtilization // Vehicles owned by partners
                }
                : utilizationData // For partners, only their own vehicles are returned
        };

        return res.status(200).json(responseData);
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const getBookingStats = async (req, res) => {
    const { userId, timePeriod } = req.query;

    try {
        const filter = {};
        if (userId) filter.userID = userId;

        const bookings = await Booking.find(filter);

        const bookingsByStatus = bookings.reduce((acc, booking) => {
            acc[booking.status] = (acc[booking.status] || 0) + 1;
            return acc;
        }, {});

        const bookingsOverTime = bookings.reduce((acc, booking) => {
            const date = booking.startDate.toISOString().split("T")[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});

        res.json({
            totalBookings: bookings.length,
            bookingsByStatus,
            bookingsOverTime: Object.entries(bookingsOverTime).map(([date, count]) => ({ date, count })),
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching booking stats" });
    }
};

export const getRevenueStats = async (req, res) => {
    const { userId, timePeriod } = req.query;

    try {
        const filter = {};
        if (userId) filter.userID = userId;

        const bookings = await Booking.find(filter);

        const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalPrice, 0);

        const revenueOverTime = bookings.reduce((acc, booking) => {
            const date = booking.startDate.toISOString().split("T")[0];
            acc[date] = (acc[date] || 0) + booking.totalPrice;
            return acc;
        }, {});

        res.json({
            totalRevenue,
            revenueOverTime: Object.entries(revenueOverTime).map(([date, amount]) => ({ date, amount })),
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching revenue stats" });
    }
};

export const getVehicleStats = async (req, res) => {
    const { userId } = req.query;

    try {
        const filter = {};
        if (userId) filter.owner = userId;

        const vehicles = await VehicleInstance.find(filter);

        const totalVehicles = vehicles.length;

        const vehiclesByStatus = vehicles.reduce((acc, vehicle) => {
            acc[vehicle.availabilityStatus] = (acc[vehicle.availabilityStatus] || 0) + 1;
            return acc;
        }, {});

        res.json({
            totalVehicles,
            vehiclesByStatus,
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching vehicle stats" });
    }
};

export const getAdminAnalytics = async (req, res) => {
    try {

        // 1️⃣ Total Revenue
        const totalRevenueData = await Booking.aggregate([
            { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } }
        ]);
        const totalRevenue = totalRevenueData[0]?.totalRevenue || 0;

        // 2️⃣ Most Booked Vehicles
        const mostBookedVehicles = await Booking.aggregate([
            {
                $group: {
                    _id: "$vehicleID",
                    count: { $sum: 1 },
                    totalRevenue: { $sum: "$totalPrice" }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
                $lookup: { from: "vehicleinstances", localField: "_id", foreignField: "_id", as: "vehicle" }
            },
            { $unwind: "$vehicle" },
            {
                $lookup: { from: "vehiclelocations", localField: "vehicle.vehicleLocationId", foreignField: "_id", as: "location" }
            },
            { $unwind: { path: "$location", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    vehicleName: { $concat: ["$vehicle.vehicleRegNumber", " - ", "$location.city"] },
                    vehicleRegNumber: "$vehicle.vehicleRegNumber",
                    location: "$location.city",
                    count: 1,
                    totalRevenue: 1
                }
            }
        ]);

        // 3️⃣ User Registration Trends
        const userTrends = await User.aggregate([
            { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
            { $sort: { "_id": 1 } }
        ]);

        // 4️⃣ Partner Performance
        const partnerPerformance = await Booking.aggregate([
            {
                $lookup: { from: "vehicleinstances", localField: "vehicleID", foreignField: "_id", as: "vehicle" }
            },
            { $unwind: "$vehicle" },
            {
                $group: {
                    _id: "$vehicle.owner",
                    totalBookings: { $sum: 1 },
                    totalRevenue: { $sum: "$totalPrice" }
                }
            },
            {
                $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "partner" }
            },
            { $unwind: "$partner" },
            {
                $project: {
                    partnerName: { $concat: ["$partner.firstName", " ", "$partner.lastName"] },
                    totalBookings: 1,
                    totalRevenue: 1
                }
            }
        ]);

        // 5️⃣ Monthly Booking Trends
        const bookingTrends = await Booking.aggregate([
            { $group: { _id: { $month: "$startDate" }, count: { $sum: 1 } } },
            { $sort: { "_id": 1 } }
        ]);

        // 6️⃣ Revenue Breakdown by Month
        const revenueByMonth = await Booking.aggregate([
            { $group: { _id: { $month: "$startDate" }, revenue: { $sum: "$totalPrice" } } },
            { $sort: { "_id": 1 } }
        ]);

        // 7️⃣ Booking Status Breakdown
        const bookingStatus = await Booking.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        // 8️⃣ Most Popular Booking Time
        const bookingTimes = await Booking.aggregate([
            { $group: { _id: "$startTime", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // 9️⃣ Vehicle Occupancy Rate
        const vehicleOccupancy = await Booking.aggregate([
            { $group: { _id: "$vehicleID", totalBookings: { $sum: 1 } } },
            {
                $lookup: { from: "vehicleinstances", localField: "_id", foreignField: "_id", as: "vehicle" }
            },
            { $unwind: "$vehicle" },
            {
                $project: {
                    vehicleName: "$vehicle.vehicleRegNumber",
                    totalBookings: 1,
                    occupancyRate: { $divide: ["$totalBookings", 30] }
                }
            }
        ]);

        // 🔟 Booking Cancellation Rate
        const totalBookings = await Booking.countDocuments();
        const cancelledBookings = await Booking.countDocuments({ status: "Cancelled" });
        const cancellationRate = (cancelledBookings / totalBookings) * 100;

        // 1️⃣1️⃣ Bookings by Location (Fixed Aggregation)
        const bookingsByLocation = await Booking.aggregate([
            {
                $lookup: { from: "vehicleinstances", localField: "vehicleID", foreignField: "_id", as: "vehicle" }
            },
            { $unwind: { path: "$vehicle", preserveNullAndEmptyArrays: true } },
            {
                $lookup: { from: "vehiclelocations", localField: "vehicle.vehicleLocationId", foreignField: "_id", as: "location" }
            },
            { $unwind: { path: "$location", preserveNullAndEmptyArrays: true } },
            {
                $match: { "location.city": { $ne: null } } // Exclude missing locations
            },
            {
                $group: {
                    _id: { city: "$location.city", state: "$location.state", country: "$location.country" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // 1️⃣2️⃣ Partner Revenue Share
        const partnerRevenueShare = await Booking.aggregate([
            {
                $lookup: { from: "vehicleinstances", localField: "vehicleID", foreignField: "_id", as: "vehicle" }
            },
            { $unwind: "$vehicle" },
            {
                $group: {
                    _id: "$vehicle.owner",
                    totalRevenue: { $sum: "$totalPrice" }
                }
            },
            {
                $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "partner" }
            },
            { $unwind: "$partner" },
            {
                $project: {
                    partnerName: { $concat: ["$partner.firstName", " ", "$partner.lastName"] },
                    totalRevenue: 1,
                    revenuePercentage: { $multiply: [{ $divide: ["$totalRevenue", totalRevenue] }, 100] }
                }
            }
        ]);

        const avgBookingDuration = await Booking.aggregate([
            // Filter invalid bookings (endDateTime <= startDateTime)
            {
                $match: {
                    $expr: { $gt: ["$endDateTime", "$startDateTime"] }
                }
            },
            // Calculate duration in hours
            {
                $project: {
                    duration: {
                        $divide: [
                            { $subtract: ["$endDateTime", "$startDateTime"] }, // Milliseconds
                            3600000 // Convert to hours
                        ]
                    }
                }
            },
            // Calculate average and round to 2 decimals
            {
                $group: {
                    _id: null,
                    avgDuration: { $avg: "$duration" }
                }
            },
            {
                $project: {
                    avgDuration: { $round: ["$avgDuration", 2] }
                }
            }
        ]);

        //top erating vehicle
        const topEarningVehicles = await Booking.aggregate([
            {
                $group: {
                    _id: "$vehicleID",
                    totalRevenue: { $sum: "$totalPrice" }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 5 },
            {
                $lookup: { from: "vehicleinstances", localField: "_id", foreignField: "_id", as: "vehicle" }
            },
            { $unwind: "$vehicle" },
            {
                $project: {
                    vehicleName: "$vehicle.vehicleRegNumber",
                    totalRevenue: 1
                }
            }
        ]);

        //booking growth rate
        const bookingGrowth = await Booking.aggregate([
            {
                $group: {
                    _id: { month: { $month: "$startDate" }, year: { $year: "$startDate" } },
                    totalBookings: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);


        // Final response
        res.json({
            totalRevenue,
            mostBookedVehicles,
            userTrends,
            partnerPerformance,
            bookingTrends,
            revenueByMonth,
            bookingStatus,
            bookingTimes,
            vehicleOccupancy,
            cancellationRate,
            bookingsByLocation,
            partnerRevenueShare,
            avgBookingDuration,
            topEarningVehicles,
            bookingGrowth
        });

    } catch (error) {
        console.error("❌ Error in Admin Analytics API:", error);
    res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getPartnerAnalytics = async (req, res) => {
    try {
        const userId = req.user._id; // Partner's user ID

        // 1️⃣ Get all vehicles owned by the partner
        const partnerVehicles = await VehicleInstance.find({ owner: userId }, '_id');
        const vehicleIds = partnerVehicles.map(v => v._id);

        if (vehicleIds.length === 0) {
            return res.json({
                summary: {
                    totalRevenue: 0,
                    totalBookings: 0,
                    cancellationRate: 0,
                    averageRating: 0
                },
                vehicles: { mostBookedVehicles: [], topEarningVehicles: [], vehicleOccupancy: [] },
                trends: { bookingTrends: [], revenueByMonth: [] },
                demographics: { customerAgeGroups: [], bookingStatus: [] }
            });
        }

        // 2️⃣ Total Revenue Calculation
        const totalRevenueData = await Booking.aggregate([
            { $match: { vehicleID: { $in: vehicleIds } } },
            { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } }
        ]);
        const totalRevenue = totalRevenueData[0]?.totalRevenue || 0;

        // 3️⃣ Most Booked Vehicles
        const mostBookedVehicles = await Booking.aggregate([
            { $match: { vehicleID: { $in: vehicleIds } } },
            { $group: { _id: "$vehicleID", count: { $sum: 1 }, totalRevenue: { $sum: "$totalPrice" } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "vehicleinstances",
                    localField: "_id",
                    foreignField: "_id",
                    as: "vehicle"
                }
            },
            { $unwind: "$vehicle" },
            {
                $project: {
                    vehicleRegNumber: "$vehicle.vehicleRegNumber",
                    count: 1,
                    totalRevenue: 1
                }
            }
        ]);

        // 4️⃣ Monthly Booking Trends
        const bookingTrends = await Booking.aggregate([
            { $match: { vehicleID: { $in: vehicleIds } } },
            { $group: { _id: { $month: "$startDate" }, count: { $sum: 1 } } },
            { $sort: { "_id": 1 } }
        ]);

        // 5️⃣ Revenue by Month
        const revenueByMonth = await Booking.aggregate([
            { $match: { vehicleID: { $in: vehicleIds } } },
            { $group: { _id: { $month: "$startDate" }, revenue: { $sum: "$totalPrice" } } },
            { $sort: { "_id": 1 } }
        ]);

        // 6️⃣ Booking Status Breakdown
        const bookingStatus = await Booking.aggregate([
            { $match: { vehicleID: { $in: vehicleIds } } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        // 7️⃣ Vehicle Occupancy Rate
        const vehicleOccupancy = await Booking.aggregate([
            { $match: { vehicleID: { $in: vehicleIds } } },
            { $group: { _id: "$vehicleID", totalBookings: { $sum: 1 } } },
            {
                $lookup: {
                    from: "vehicleinstances",
                    localField: "_id",
                    foreignField: "_id",
                    as: "vehicle"
                }
            },
            { $unwind: "$vehicle" },
            {
                $project: {
                    vehicleRegNumber: "$vehicle.vehicleRegNumber",
                    totalBookings: 1,
                    occupancyRate: { $divide: ["$totalBookings", 30] }
                }
            }
        ]);

        // 8️⃣ Cancellation Rate
        const totalBookings = await Booking.countDocuments({ vehicleID: { $in: vehicleIds } });
        const cancelledBookings = await Booking.countDocuments({
            vehicleID: { $in: vehicleIds },
            status: "Cancelled"
        });
        const cancellationRate = totalBookings > 0
            ? (cancelledBookings / totalBookings) * 100
            : 0;

        // 9️⃣ Top Earning Vehicles
        const topEarningVehicles = await Booking.aggregate([
            { $match: { vehicleID: { $in: vehicleIds } } },
            { $group: { _id: "$vehicleID", totalRevenue: { $sum: "$totalPrice" } } },
            { $sort: { totalRevenue: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "vehicleinstances",
                    localField: "_id",
                    foreignField: "_id",
                    as: "vehicle"
                }
            },
            { $unwind: "$vehicle" },
            {
                $project: {
                    vehicleRegNumber: "$vehicle.vehicleRegNumber",
                    totalRevenue: 1
                }
            }
        ]);

        // 🔟 Customer Demographics
        const customerDemographics = await Booking.aggregate([
            { $match: { vehicleID: { $in: vehicleIds } } },
            {
                $lookup: {
                    from: "users",
                    localField: "userID",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            { $group: { _id: "$user.ageGroup", count: { $sum: 1 } } }
        ]);

        // 1️⃣1️⃣ Average Rating
        const averageRating = await VehicleRating.aggregate([
            {
                $match: {
                    vehicleId: { // Use correct field name from schema
                        $in: vehicleIds.map(id => new mongoose.Types.ObjectId(id))
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" },
                    totalRatings: { $sum: 1 }
                }
            }
        ]);

        res.json({
            summary: {
                totalRevenue,
                totalBookings,
                cancellationRate,
                averageRating: averageRating[0]?.averageRating || 0
            },
            vehicles: {
                mostBookedVehicles,
                topEarningVehicles,
                vehicleOccupancy
            },
            trends: {
                bookingTrends,
                revenueByMonth
            },
            demographics: {
                customerAgeGroups: customerDemographics,
                bookingStatus
            }
        });

    } catch (error) {
        console.error("❌ Error in Partner Analytics:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch partner analytics",
      error: "Internal Server Error"
        });
    }
};
