import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { BookingSchema } from "../../validators/booking.vaildator";
import CustomerNav from "../../component/Header/Header";
import Footer from "../../component/Footer/Footer";
import { useVehicleStore } from "../../store/useVehicleStore";
import { useAuthStore } from "../../store/useAuthStore";
import { usePaymentStore } from "../../store/usePaymentStore";
import { Loader } from "lucide-react";
import toast from "react-hot-toast";

export default function Booking() {
  const { vehicleID } = useParams();
  const { fetchOneVehicleData, bookVehicle, isBooking } = useVehicleStore();
  const { createOrder, verifyPayment } = usePaymentStore();
  const { authUser } = useAuthStore();
  const [vehicle, setVehicle] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [vehicleCharge, setVehicleCharge] = useState(0);
  const [fullDays, setFullDays] = useState(0);
  const [remainingHours, setRemainingHours] = useState(0);
  const [accessoryTotal, setAccessoryTotal] = useState(0);
  const securityDeposit = 500;
  const navigate = useNavigate();

  const [accessories, setAccessories] = useState({
    ac: false,
    radio: false,
    childSeat: false,
  });

  const accessoryPrices = {
    ac: 200,
    radio: 100,
    childSeat: 300,
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(BookingSchema),
    defaultValues: {
      firstName: authUser?.firstName || "",
      lastName: authUser?.lastName || "",
      email: authUser?.email || "",
      phone: authUser?.mobile || "",
      startDateTime: "",
      endDateTime: "",
    },
  });

  // Fetch vehicle data
  useEffect(() => {
    const fetchVehicle = async () => {
      if (!vehicleID) return;
      try {
        const vehicleData = await fetchOneVehicleData(vehicleID);
        setVehicle(vehicleData);
      } catch (error) {
        console.error("Error fetching vehicle:", error);
      }
    };
    fetchVehicle();
  }, [vehicleID, fetchOneVehicleData]);

  // Calculate total price based on date and time inputs
  useEffect(() => {
    const startDateTime = watch("startDateTime");
    const endDateTime = watch("endDateTime");

    if (startDateTime && endDateTime && vehicle) {
      const start = new Date(startDateTime);
      const end = new Date(endDateTime);
      const diffHours = (end - start) / (1000 * 60 * 60);

      if (diffHours > 0) {
        const days = Math.floor(diffHours / 24);
        const hours = diffHours % 24;

        const dailyRate = parseFloat(vehicle.pricePerDay?.$numberDecimal || 0);
        const hourlyRate = parseFloat(
          vehicle.pricePerHour?.$numberDecimal || 0,
        );

        const vehicleCost = days * dailyRate + hours * hourlyRate;

        // Calculate total for selected accessories
        const newAccessoryTotal = Object.entries(accessories).reduce(
          (sum, [key, value]) =>
            value ? sum + (accessoryPrices[key] || 0) : sum,
          0,
        );

        setFullDays(days);
        setRemainingHours(hours);
        setVehicleCharge(vehicleCost);
        setTotalPrice(
          Math.round(vehicleCost + newAccessoryTotal + securityDeposit),
        );
        setAccessoryTotal(newAccessoryTotal);
      }
    }
  }, [watch("startDateTime"), watch("endDateTime"), vehicle, accessories]);

  const handleAccessoryChange = (e) => {
    setAccessories((prev) => ({ ...prev, [e.target.name]: e.target.checked }));
  };

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
      </div>
    );
  }
  const onSubmit = async (data) => {
    // Prepare booking details for later storage
    const bookingDetails = {
      vehicleID,
      userID: authUser?._id,
      startDateTime: data.startDateTime,
      endDateTime: data.endDateTime,
      totalPrice,
      accessories,
    };

    console.log("Booking Details:", bookingDetails);

    try {
      // Create an order for payment via the Payment Store.
      const orderData = {
        amount: totalPrice, // Ensure this is in the correct smallest currency unit for Razorpay
        currency: "INR",
        receipt: "receipt#booking",
        notes: { vehicleID, userID: authUser?._id },
      };

      const order = await createOrder(orderData);
      console.log("Order created:", order);
      console.log("Razorpay Key ID:", import.meta.env.VITE_RAZORPAY_KEY_ID);

      // Configure Razorpay Checkout options using the created order details
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Razorpay key_id from env
        amount: order.amount,
        currency: order.currency,
        name: "ClickRide",
        description: "Booking Payment",
        order_id: order.id, // order id from your backend
        prefill: {
          name: authUser?.name || "Customer Name",
          email: authUser?.email || "customer@example.com",
          contact: authUser?.mobile || "9999999999",
        },
        theme: {
          color: "#F37254",
        },
        // Handler to be called on successful payment
        handler: async function (response) {
          console.log("Razorpay response:", response);
          try {
            // Prepare verification payload
            const verificationPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            };
            console.log("Verification payload:", verificationPayload);

            // Verify payment via the Payment Store
            const verifyResponse = await verifyPayment(verificationPayload);
            console.log("Backend verification response:", verifyResponse);

            // Check for success in the verification response
            if (verifyResponse && verifyResponse.success) {
              // Payment is verified, proceed with vehicle booking
              const book = await bookVehicle(bookingDetails);
              console.log("Book Response:", book);
              if (book?.success) {
                toast.success("Vehicle Successfully Booked!");
                navigate("/ViewVehicle");
              } else {
                toast.error(
                  `Booking Failed: ${book?.message || "Unknown Error"}`,
                );
              }
            } else {
              toast.error("Payment verification failed");
            }
          } catch (error) {
            console.error("Verification error:", error);
            toast.error("Error during payment verification");
          }
        },
        // Optionally, you can set a callback_url if needed
        callback_url: "http://localhost:3000/payment-success",
      };

      console.log("Razorpay Options:", options);
      // Open Razorpay Checkout
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("An error occurred during the booking/payment process.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNav />
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 mt-10">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-12">
          Book Your Vehicle
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Vehicle Details Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="relative h-64">
              <img
                src={vehicle.vehicleImagesId.VehicleFrontPic}
                alt="Vehicle"
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
              <div className="absolute top-4 right-4 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                {vehicle.modelID.vehicleType}
              </div>
            </div>

            <div className="p-6 space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Vehicle Details
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Brand & Model</p>
                    <p className="font-medium">
                      {vehicle.modelID.vehicleMake}{" "}
                      {vehicle.modelID.vehicleModel}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fuel Type</p>
                    <p className="font-medium">{vehicle.vehicleFuelType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Registration Number</p>
                    <p className="font-medium">{vehicle.vehicleRegNumber}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Seating</p>
                    <p className="font-medium">{vehicle.vehicleSeat} Seats</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Transmission</p>
                    <p className="font-medium">{vehicle.vehicleTransmission}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-500">Hourly Rate</span>
                  <span className="text-lg font-bold text-blue-600">
                    ₹{vehicle.pricePerHour?.$numberDecimal}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Daily Rate</span>
                  <span className="text-lg font-bold text-blue-600">
                    ₹{vehicle.pricePerDay?.$numberDecimal}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Form Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Enter Your Details
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    {...register("firstName")}
                    placeholder="First Name"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    {...register("lastName")}
                    placeholder="Last Name"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <input
                type="email"
                {...register("email")}
                placeholder="Email Address"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}

              <input
                type="tel"
                {...register("phone")}
                placeholder="Phone Number"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.phone.message}
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  {...register("startDateTime")}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                />
                {errors.startDateTime && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.startDateTime.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  {...register("endDateTime")}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                />
                {errors.endDateTime && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.endDateTime.message}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Additional Accessories
                </label>
                <div className="space-y-2">
                  {Object.entries(accessoryPrices).map(([key, price]) => (
                    <label
                      key={key}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        name={key}
                        onChange={handleAccessoryChange}
                        className="w-4 h-4 text-blue-500 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">
                        {key.charAt(0).toUpperCase() + key.slice(1)} - ₹{price}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              {isBooking ? (
                <div className="flex items-center justify-center">
                  <Loader className="size-10 animate-spin" />
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300 mt-6"
                >
                  Confirm Booking
                </button>
              )}
            </form>
          </div>

          {/* Summary Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 h-fit">
            <h2 className=" text-center text-2xl font-bold text-gray-900 ">
              Booking Summary
            </h2>

            <h3 className="text-center text-xl font-bold text-gray-900 mb-6">
              {vehicle.vehicleRegNumber}
            </h3>

            <div className="space-y-4">
              <div className="pb-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Vehicle Charges
                </h3>

                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Total Vehicle Cost</span>
                  <span className="font-medium">₹{vehicleCharge}</span>
                </div>

                {fullDays > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Day Price</span>
                    <span className="font-medium text-gray-500">
                      ₹{fullDays * (vehicle?.pricePerDay?.$numberDecimal || 0)}
                    </span>
                  </div>
                )}

                {remainingHours > 0 && (
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-500">Hour Charges</span>
                    <span className="font-medium text-gray-500">
                      ₹
                      {remainingHours *
                        (vehicle?.pricePerHour?.$numberDecimal || 0)}
                    </span>
                  </div>
                )}
              </div>

              {Object.values(accessories).some((value) => value) && (
                <div className="pb-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Added Accessories
                  </h3>
                  {Object.entries(accessories).map(
                    ([key, value]) =>
                      value && (
                        <div
                          key={key}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="text-gray-600">
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </span>
                          <span className="font-medium text-gray-900">
                            ₹{accessoryPrices[key]}
                          </span>
                        </div>
                      ),
                  )}
                </div>
              )}

              <div className="pb-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Additional Charges
                </h3>
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-gray-600">Security Deposit</span>
                  <span className="font-medium text-gray-900">
                    ₹{securityDeposit}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">
                  Total Amount
                </span>
                <span className="text-2xl font-bold text-blue-600">
                  ₹{totalPrice.toFixed(2)}
                </span>
              </div>

              <p className="text-sm text-gray-500 mt-4">
                * Final amount includes all applicable taxes and fees. <br />* A
                refundable security deposit of ₹{securityDeposit} is included in
                the total.
                <br />
                * Cancellations made within 24 hours of the booking start time
                may be subject to a cancellation fee.
                <br />* Additional charges may apply for late returns, fuel
                policy violations, or vehicle damage.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
