import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Calendar, Car, ArrowLeft, MapPin, Clock, DollarSign,
    User, Phone, Mail, Eye, EyeOff, XCircle, AlertCircle, Download, XSquare,
    CheckCircle, Loader2, ChevronLeft, RefreshCw
} from 'lucide-react';
import BookingPDF from '../../component/pdf/BookingPDF';
import Header from "../../component/Header/Header";
import { CustomerSideNav } from "../../component/Customer/CustomerSideNav";
import { useVehicleStore } from '../../store/useVehicleStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useBookStore } from '../../store/useBookStore';
import toast from "react-hot-toast";

const BookingDetailsPage = () => {
    const { bookingID } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(true);
    const { getVehicleHistory, bookingDetails } = useVehicleStore();
    const { verifyRide, UnverifyRide, checkBookStatus } = useBookStore();
    const { authUser, UserRole } = useAuthStore();
    const [showOtp, setShowOtp] = useState(false);

    useEffect(() => {
        fetchBookingHistory();
        fetchBookingStatus();
    }, []);


    useEffect(() => {
        if (bookingDetails && bookingDetails.length > 0 && bookingID) {
            // Find the specific booking by ID
            const currentBooking = bookingDetails.find(booking => booking._id === bookingID);
            if (currentBooking) {
                setBooking(currentBooking);
            } else {
                setError('Booking not found');
            }
            setLoading(false);
        }
    }, [bookingDetails, bookingID]);

    const fetchBookingStatus = async () => {
        try {
            const data = {
                bookingId: bookingID
            }
            const response = await checkBookStatus(data);

            if (response?.status === "Active") {
                setVehicleHandedOver(true);
                setIsOtpMatched(true)
            }
        } catch (error) {
            console.error("Failed to check booking status:", error);
        }
    };

    const fetchBookingHistory = async () => {
        try {
            if (!authUser?._id) {
                console.error("❌ [ERROR] User ID is missing.");
                setError("User authentication failed. Please log in again.");
                setLoading(false);
                return;
            }
            setLoading(true);
            await getVehicleHistory({ userID: authUser._id, role: UserRole });
        } catch (error) {
            console.error("❌ [ERROR] Failed to fetch booking history:", error);
            setError("Failed to fetch booking details. Please try again later.");
            setLoading(false);
        }
    };

    // Helper function to get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'Booked':
            case 'Active':
                return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            case 'Completed':
                return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'Cancelled':
                return 'text-rose-600 bg-rose-50 border-rose-200';
            case 'Pending':
                return 'text-amber-600 bg-amber-50 border-amber-200';
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Booked':
            case 'Active':
                return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            case 'Completed':
                return <CheckCircle className="w-4 h-4 text-blue-500" />;
            case 'Cancelled':
                return <XSquare className="w-4 h-4 text-rose-500" />;
            case 'Pending':
                return <Clock className="w-4 h-4 text-amber-500" />;
            default:
                return <AlertCircle className="w-4 h-4 text-gray-500" />;
        }
    };

    // Calculate rental duration in days
    const calculateDuration = (startDateTime, endDateTime) => {
        const start = new Date(startDateTime);
        const end = new Date(endDateTime);

        // Validate dates
        if (isNaN(start) || isNaN(end)) return "Invalid dates";
        if (end <= start) return "0 minutes";

        const diffMs = end - start;

        // Calculate components
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        // Build duration string
        const parts = [];
        if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
        if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
        if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
        if (seconds > 0 && parts.length === 0) parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);

        return parts.join(' ') || "0 minutes";
    };


    // Format date to display date and time
    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format date to display date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Format time to display time
    const formatTime = (dateString, timeString) => {
        if (timeString) {
            // If separate time string is provided (in format like "12:35")
            return timeString;
        }

        // Otherwise use the date object
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Function to format accessories array into readable text
    const accessoryPrices = {
        'ac': 100,
        'radio': 200,
        'childSeat': 300
    };

    // Format for display with prices
    const formatAccessoriesWithPrices = (accessories) => {
        if (!accessories || accessories.length === 0) {
            return "No accessories selected";
        }

        return accessories.map(accessory => (
            <div key={accessory} className="flex items-center justify-between py-2">
                <span className="text-gray-800">{accessory}</span>
                <span className="font-medium text-gray-900">${accessoryPrices[accessory]}</span>
            </div>
        ));
    };

    // Format for text-only display (converts camelCase to Title Case)
    const formatAccessoriesText = (accessories) => {
        if (!accessories || accessories.length === 0) return "None";

        return accessories.map(item => {
            // Convert camelCase to Title Case (e.g., childSeat -> Child Seat)
            return item.replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase());
        }).join(', ');
    };

    const calculateTotal = (accessories) => {
        return accessories.reduce((total, item) => total + (accessoryPrices[item] || 0), 0);
    };

    const [enteredOtp, setEnteredOtp] = useState();
    const [isOtpMatched, setIsOtpMatched] = useState(null);

    const handleOtpVerification = () => {
        if (enteredOtp === booking?.otp?.toString()) {
            setIsOtpMatched(true);
        } else {
            setIsOtpMatched(false);
        }
    };

    const [vehicleHandedOver, setVehicleHandedOver] = useState(false);

    const handleHandOver = async () => {
        try {
            const body = {
                bookingId: bookingID
            }; // Corrected variable reference
            const response = await verifyRide(body); // Fixed variable name

            if (response) {
                setVehicleHandedOver(true);
            }

            toast.success("Vehicle successfully handed over!");
        } catch (error) {
            console.error("Error handing over vehicle:", error);
            toast.error("Failed to hand over vehicle. Please try again.");
        }
    };

    const handleCancelHandover = async () => {
        try {
            const body = {
                bookingId: bookingID
            }; // Corrected variable reference
            const response = await UnverifyRide(body); // Fixed variable name

            if (response) {
                setVehicleHandedOver(false);
            }

            toast.success("Vehicle handedover Cancelled!");
        } catch (error) {
            console.error("Error handing over vehicle:", error);
            toast.error("Failed to hand over vehicle. Please try again.");
        }
    };
    return (
        <div className="bg-gray-50 min-h-screen">
            <Header />
            <CustomerSideNav />
            <div className={`transition-all duration-300 ${isDrawerOpen ? "lg:pl-[16rem]" : ""}`}>
                <div className="mt-20 p-4 md:p-6 max-w-7xl mx-auto">
                    {loading ? (
                        <div className="flex justify-center items-center p-12 bg-white rounded-xl shadow-sm">
                            <div className="flex flex-col items-center">
                                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                                <span className="text-gray-600 font-medium">Loading booking details...</span>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                            <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h3>
                            <p className="text-gray-600 mb-6">{error}</p>
                            <button
                                onClick={() => navigate('/ViewHistory')}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                            >
                                Back to Booking History
                            </button>
                        </div>
                    ) : booking ? (
                        <div>
                            {/* Back button */}
                            <button
                                onClick={() => navigate('/ViewHistory')}
                                className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6 group transition-colors font-medium"
                            >
                                <ChevronLeft className="w-5 h-5 mr-1 group-hover:translate-x-[-2px] transition-transform" />
                                Back to Booking History
                            </button>

                            {/* Main content */}
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                {/* Header */}
                                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50">
                                    <div className="flex flex-wrap justify-between items-center">
                                        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                                            <Car className="w-6 h-6 text-indigo-600 mr-2" />
                                            Booking #{booking._id ? booking._id.substr(-6).toUpperCase() : ""}
                                        </h2>
                                        <div className="flex items-center mt-2 sm:mt-0">
                                            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${getStatusColor(booking.status)}`}>
                                                {getStatusIcon(booking.status)}
                                                <span className="font-semibold">
                                                    {booking.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Vehicle Image and Info */}
                                <div className="md:flex">
                                    {/* Vehicle Image */}
                                    <div className="md:w-1/3 relative">
                                        <div
                                            className="h-64 md:h-full bg-cover bg-center"
                                            style={{
                                                backgroundImage: `url(${booking.vehicleID?.vehicleImagesId?.VehicleFrontPic || "/api/placeholder/400/320"})`,
                                                backgroundPosition: 'center',
                                                backgroundSize: 'cover'
                                            }}
                                        ></div>
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 md:hidden">
                                            <h3 className="text-xl font-bold text-white">
                                                {booking.vehicleID?.vehicleRegNumber || "Unknown Vehicle"}
                                            </h3>
                                            <p className="text-white/90">
                                                {booking.vehicleID?.modelID?.vehicleMake} {booking.vehicleID?.modelID?.vehicleModel} {booking.vehicleID?.manufacturingYear}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Booking Info */}
                                    <div className="md:w-2/3 p-6">
                                        <div className="mb-6 hidden md:block">
                                            <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center cursor-pointer hover:text-indigo-600 transition-colors"
                                                onClick={() => navigate(`/vehicleDetails/${booking.vehicleID?._id}`)}>
                                                <Car className="w-5 h-5 text-indigo-600 mr-2" />
                                                {booking.vehicleID?.vehicleRegNumber || "Unknown Vehicle"}
                                            </h3>
                                            <p className="text-gray-600">
                                                {booking.vehicleID?.modelID?.vehicleMake} {booking.vehicleID?.modelID?.vehicleModel} {booking.vehicleID?.manufacturingYear}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Pickup Details */}
                                            <div className="bg-indigo-50 rounded-lg p-4">
                                                <h4 className="font-semibold text-indigo-700 mb-3 flex items-center">
                                                    <Calendar className="w-5 h-5 mr-2" />
                                                    Pickup Details
                                                </h4>
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-sm text-indigo-600 mb-1">Date</p>
                                                        <p className="text-gray-700 font-medium">{formatDate(booking.startDateTime)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-indigo-600 mb-1">Time</p>
                                                        <p className="text-gray-700 font-medium">{formatTime(booking.startDateTime)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-indigo-600 mb-1">Location</p>
                                                        {booking.vehicleID?.vehicleLocationId ? (
                                                            <a
                                                                href={`https://www.google.com/maps?q=${booking.vehicleID.vehicleLocationId.latitude},${booking.vehicleID.vehicleLocationId.longitude}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:underline"
                                                            >
                                                                {`${booking.vehicleID.vehicleLocationId.vehicleAddress}, ${booking.vehicleID.vehicleLocationId.city}, ${booking.vehicleID.vehicleLocationId.state}`}
                                                            </a>
                                                        ) : (
                                                            <p className="text-gray-700">Not specified</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Return Details */}
                                            <div className="bg-blue-50 rounded-lg p-4">
                                                <h4 className="font-semibold text-blue-700 mb-3 flex items-center">
                                                    <Calendar className="w-5 h-5 mr-2" />
                                                    Return Details
                                                </h4>
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-sm text-blue-600 mb-1">Date</p>
                                                        <p className="text-gray-700 font-medium">{formatDate(booking.endDateTime)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-blue-600 mb-1">Time</p>
                                                        <p className="text-gray-700 font-medium">{formatTime(booking.endDateTime)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-blue-600 mb-1">Location</p>
                                                        <p className="text-gray-700">{booking.returnLocation || "Same as pickup location"}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Booking Details */}
                                <div className="p-6 bg-gray-50 border-t border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-800 mb-6">Booking Summary</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Rental Duration */}
                                        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                            <div className="flex items-center mb-3">
                                                <div className="p-2 rounded-lg bg-indigo-100 mr-3">
                                                    <Clock className="w-5 h-5 text-indigo-600" />
                                                </div>
                                                <h4 className="font-medium text-gray-700">Rental Duration</h4>
                                            </div>
                                            <p className="text-3xl font-bold text-gray-800">
                                                {calculateDuration(booking.startDateTime, booking.endDateTime)}
                                            </p>

                                        </div>

                                        {/* Daily Rate */}
                                        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                            <div className="flex items-center mb-3">
                                                <div className="p-2 rounded-lg bg-blue-100 mr-3">
                                                    <DollarSign className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <h4 className="font-medium text-gray-700">Daily Rate</h4>
                                            </div>
                                            <p className="text-3xl font-bold text-gray-800">
                                                ₹{booking.vehicleID?.pricePerDay?.$numberDecimal || "N/A"} <span className="text-lg text-gray-600">/day</span>
                                            </p>
                                        </div>

                                        {/* Total Amount */}
                                        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                            <div className="flex items-center mb-3">
                                                <div className="p-2 rounded-lg bg-emerald-100 mr-3">
                                                    <DollarSign className="w-5 h-5 text-emerald-600" />
                                                </div>
                                                <h4 className="font-medium text-gray-700">Total Amount</h4>
                                            </div>
                                            <p className="text-3xl font-bold text-emerald-600">
                                                ₹{booking.totalPrice?.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Additional Options */}
                                    <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                            <CheckCircle className="w-5 h-5 text-indigo-600 mr-2" />
                                            Accessories & Add-ons
                                        </h4>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            {/* Display accessories with prices */}
                                            {formatAccessoriesWithPrices(booking.accessories)}


                                            {/* Text-only formatted version (hidden by default, toggle as needed) */}
                                            <div className="mt-2 text-sm text-gray-500 hidden">
                                                All accessories: {formatAccessoriesText(booking.accessories)}
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <div className="flex items-center justify-between font-semibold">
                                                    <span>Total</span>
                                                    <span>${calculateTotal(booking.accessories)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Customer Information */}
                                    <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                            <User className="w-5 h-5 text-indigo-600 mr-2" />
                                            Customer Information
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-gray-500 mb-1">Customer Name</span>
                                                <span className="text-gray-800 font-medium">{booking.userID ? `${booking.userID.firstName} ${booking.userID.lastName}` : "Not available"}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm text-gray-500 mb-1">Phone Number</span>
                                                <span className="text-gray-800 font-medium">{booking.userID?.mobile || "Not available"}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm text-gray-500 mb-1">Email</span>
                                                <span className="text-gray-800 font-medium">{booking.userID?.email || "Not available"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Vehicle Owner Information */}
                                    <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                            <User className="w-5 h-5 text-indigo-600 mr-2" />
                                            Vehicle Owner Information
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-gray-500 mb-1">Owner Name</span>
                                                <span className="text-gray-800 font-medium">
                                                    {booking.vehicleID?.owner
                                                        ? `${booking.vehicleID.owner.firstName} ${booking.vehicleID.owner.lastName}`
                                                        : "Not available"}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm text-gray-500 mb-1">Phone Number</span>
                                                <span className="text-gray-800 font-medium">
                                                    {booking.vehicleID?.owner?.mobile || "Not available"}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm text-gray-500 mb-1">Email</span>
                                                <span className="text-gray-800 font-medium">
                                                    {booking.vehicleID?.owner?.email || "Not available"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Vehicle Details */}
                                    <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                            <Car className="w-5 h-5 text-indigo-600 mr-2" />
                                            Vehicle Details
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-gray-500 mb-1">Vehicle Type</span>
                                                <span className="text-gray-800 font-medium capitalize">{booking.vehicleID?.modelID?.vehicleType || "Not available"}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm text-gray-500 mb-1">Transmission</span>
                                                <span className="text-gray-800 font-medium capitalize">{booking.vehicleID?.vehicleTransmission || "Not available"}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm text-gray-500 mb-1">Fuel Type</span>
                                                <span className="text-gray-800 font-medium capitalize">{booking.vehicleID?.vehicleFuelType || "Not available"}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm text-gray-500 mb-1">Seating Capacity</span>
                                                <span className="text-gray-800 font-medium">{booking.vehicleID?.vehicleSeat || "Not available"} Seats</span>
                                            </div>
                                        </div>
                                    </div>
                                    {booking?.otp && (
                                        <div className="mt-8 bg-white p-6 rounded-xl shadow-md border border-gray-200">
                                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                                                <AlertCircle className="w-5 h-5 text-indigo-600 mr-2" />
                                                Additional Information
                                            </h4>

                                            <div className="space-y-4">
                                                <p className="text-sm text-gray-600 font-medium">OTP for Verification</p>

                                                {UserRole === "Customer" ? (
                                                    // Customer View (OTP Display with Toggle)
                                                    <div className="flex items-center space-x-3">
                                                        <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 inline-flex items-center">
                                                            <span className="text-gray-800 font-medium tracking-wider">
                                                                {showOtp ? booking.otp || "Not available" : "••••••"}
                                                            </span>
                                                            <button
                                                                onClick={() => setShowOtp(!showOtp)}
                                                                className="ml-3 text-gray-500 hover:text-indigo-600 focus:outline-none transition-colors"
                                                                aria-label={showOtp ? "Hide OTP" : "Show OTP"}
                                                            >
                                                                {showOtp ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // Partner View (OTP Input + Verification)
                                                    <div className="space-y-4">
                                                        {!isOtpMatched ? (
                                                            <div className="flex items-center">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Enter OTP"
                                                                    value={enteredOtp}
                                                                    onChange={(e) => setEnteredOtp(e.target.value)}
                                                                    className="w-40 px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                                                />
                                                                <button
                                                                    onClick={handleOtpVerification}
                                                                    className="ml-3 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
                                                                >
                                                                    Verify
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center">
                                                                <div className="bg-green-50 px-4 py-3 rounded-lg border border-green-200 text-green-700 font-medium flex items-center">
                                                                    <CheckCircle className="w-5 h-5 mr-2" />
                                                                    Verified Successfully
                                                                </div>
                                                            </div>
                                                        )}

                                                        {isOtpMatched === false && (
                                                            <div className="flex items-center text-red-500 text-sm">
                                                                <XCircle className="w-4 h-4 mr-1" />
                                                                Incorrect OTP. Please try again.
                                                            </div>
                                                        )}

                                                        {isOtpMatched && (
                                                            <div className="space-y-3">
                                                                <p className="text-sm text-gray-600 font-medium">Vehicle Handover Status</p>

                                                                {!vehicleHandedOver ? (
                                                                    <div className="flex items-center space-x-3">
                                                                        <button
                                                                            onClick={handleHandOver}
                                                                            className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition flex items-center"
                                                                        >
                                                                            <CheckCircle className="w-4 h-4 mr-2" />
                                                                            Confirm Vehicle Handover
                                                                        </button>
                                                                        <button
                                                                            onClick={handleCancelHandover}
                                                                            className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition flex items-center"
                                                                        >
                                                                            <XCircle className="w-4 h-4 mr-2" />
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col space-y-3">
                                                                        <div className="bg-green-50 px-4 py-3 rounded-lg border border-green-200 text-green-700 font-medium flex items-center">
                                                                            <CheckCircle className="w-5 h-5 mr-2" />
                                                                            Vehicle Successfully Handed Over
                                                                        </div>
                                                                        <button
                                                                            onClick={() => setVehicleHandedOver(false)}
                                                                            className="px-4 py-3 w-max bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition flex items-center"
                                                                        >
                                                                            <RefreshCw className="w-4 h-4 mr-2" />
                                                                            Undo
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}


                                </div>

                                {/* Action Buttons */}
                                <div className="p-6 border-t border-gray-100 flex flex-wrap justify-between items-center bg-white">
                                    <BookingPDF booking={booking} className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg flex items-center">
                                        <Download className="w-5 h-5 mr-2" />
                                        Download Booking Invoice
                                    </BookingPDF>

                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                            <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Booking not found</h3>
                            <p className="text-gray-600 mb-6">We couldn't find the booking you're looking for.</p>
                            <button
                                onClick={() => navigate('/ViewHistory')}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                            >
                                Back to Booking History
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingDetailsPage;
