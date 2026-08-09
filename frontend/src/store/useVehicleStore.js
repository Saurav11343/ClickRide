import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";


export const useVehicleStore = create((set) => ({

    isAddingVehicle: false,
    isUpdatingVehicle: false,
    isDeletingVehicle: false,
    isUpdatingModel: false,
    isDeletingModel: false,
    isDeleteingRequest: false,
    isRequesting: false,
    isRejecting: false,
    isUpdating: false,
    isBooking: false,
    isBookingCancel: false,
    vehicles: [],
    vehicleDetails: [],
    vehicleModelDetails: [],
    updateResponce: [],
    totalUpdateRequest: [],
    totalUpdateResponce: [],
    bookingDetails: [],
    totalBookings: [],


    addVehicles: async (data) => {
        try {
            set({ isAddingVehicle: true })
            const res = await axiosInstance.post("/vehicle/addVehicle", data);
            set((state) => ({
                vehicles: [...state.vehicles, res.data],
            }));
            return { success: true, message: res.data.message };
        } catch (error) {
            return { success: false };

        } finally {
            set({ isAddingVehicle: false })
        }
    },

    fetchVehicleData: async () => {
        try {
            const res = await axiosInstance.get("/vehicle/vehicles"); // Adjust the endpoint as needed
            const data = res.data;

            if (data && typeof data.totalVehicles === "number" && Array.isArray(data.vehicleDetails)) {
                set({
                    totalVehicles: data.totalVehicles,
                    vehicleDetails: data.vehicleDetails,
                });
            } else {
                console.error("Invalid response structure for vehicles:", data);
                toast.error("Received invalid vehicle data");
            }
        } catch (error) {
            console.error("Error fetching vehicle stats:", error);
            toast.error("Failed to fetch vehicle data");
        }
    },

    fetchOneVehicleData: async (id) => {
        try {
            const res = await axiosInstance.get(`/vehicle/vehicles/${id}`);
            const data = res.data;

            set({
                vehicleDetails: data.vehicleDetails,
            });
            return data.vehicleDetails;
        } catch (error) {
            console.error("Error fetching vehicle stats:", error);
            toast.error("Failed to fetch vehicle data");
        }
    },

    UpdateOneVehicleData: async (updatedata) => {
        try {
            set({ isUpdatingVehicle: true })
            const res = await axiosInstance.post(`/vehicle/updatevehicle`, updatedata);
            const data = res.data;

            toast.success("Vehicle data updated successfully!");
            return { success: true };
        } catch (error) {
            console.error("Error fetching vehicle stats:", error);
            toast.error("Failed to fetch vehicle data");
            return { success: false };
        } finally {
            set({ isUpdatingVehicle: false })
        }
    },

    DeleteOneVehicleData: async (deletedata) => {
        try {
            set({ isDeletingVehicle: true })
            const res = await axiosInstance.post(`/vehicle/deleteVehicle`, deletedata);
            const data = res.data;

            toast.success("Vehicle data deleted successfully!");
            return { success: true };
        } catch (error) {
            console.error("Error fetching vehicle stats:", error);
            toast.error("Failed to fetch vehicle data");
            return { success: false };
        } finally {
            set({ isDeletingVehicle: false })

        }
    },

    vehicleUpdateRequest: async (requestdata) => {
        try {
            set({ isRequesting: true })
            const res = await axiosInstance.post('/vehicle/vehicleUpdateRequest', requestdata);
            const data = res.data;
            if (data.success) {
                set({
                    updateResponce: data.UpdateRequest,
                });
            };
            toast.success("Vehicle update request send successfully!");
            return { success: true };
        } catch (error) {
            console.error("Error fetching vehicle stats:", error);
            toast.error("Failed to fetch vehicle data");
            return { success: false };
        } finally {
            set({ isRequesting: false })

        }
    },

    fetchVehicleModelData: async () => {
        try {
            // Make API request
            const res = await axiosInstance.get("/vehicle/vehiclesModel"); // Adjust the endpoint as needed
            const data = res.data;

            // Check if data structure matches the expected format
            if (
                data &&
                typeof data.totalVehicleModels === "number" &&
                Array.isArray(data.vehicleModelDetails)
            ) {
                set({
                    totalVehicleModels: data.totalVehicleModels,
                    vehicleModelDetails: data.vehicleModelDetails,
                });
            } else {
                console.error("Invalid response structure for vehicle models:", data);
                toast.error("Received invalid vehicle model data");
            }
        } catch (error) {
            console.error("Error fetching vehicle model stats:", error);
            toast.error("Failed to fetch vehicle model data");
        }
    },

    updateVehicleModel: async (updateModelData) => {

        try {
            set({ isUpdatingModel: true });
            const res = await axiosInstance.put("/vehicle/updateModelPic", updateModelData);

            return { success: true };
        } catch (error) {
            toast.error(error.response.data.message);
            return { success: false };
        } finally {
            set({ isUpdatingModel: false })
        }
    },

    deleteVehicleModel: async (DeleteModelData) => {

        try {
            set({ isDeletingModel: true });
            const res = await axiosInstance.post("/vehicle/DeleteModel", DeleteModelData);
            return { success: true };
        } catch (error) {
            toast.error(error.response.data.message);
            return { success: false };
        } finally {
            set({ isDeletingModel: false })
        }
    },

    fetchVehicleUpdateRequestData: async (statusData) => {
        try {
            const res = await axiosInstance.get("/vehicle/vehicelPendingUpdateRequestData", statusData); // Adjust the endpoint as needed
            const data = res.data;

            if (data && typeof data.totalUpdateRequest === "number" && Array.isArray(data.totalUpdateResponce)) {
                set({
                    totalUpdateRequest: data.totalUpdateRequest,
                    totalUpdateResponce: data.totalUpdateResponce,
                });
            } else {
                console.error("Invalid response structure for vehicles:", data);
                toast.error("Received invalid vehicle data");
            }
        } catch (error) {
            console.error("Error fetching vehicle stats:", error);
            toast.error("Failed to fetch vehicle data");
        }
    },

    UpdateRequestStatus: async (requestData) => {
        try {
            set({ isUpdating: true });
            const res = await axiosInstance.post("/vehicle/updateRequestStatus", requestData);
            const data = res.data;

            if (data && data.success) {
                toast.success("Request status updated successfully");
                return data;  // Returning the response for further processing if needed
            } else {
                // If the response does not indicate success
                const errorMessage = data?.message || "Failed to update request status";
                toast.error(errorMessage);
                return null;  // Returning null if update failed
            }

        } catch (error) {
            console.error("Error updating request status:", error);
            toast.error("Failed to update request status");
            return null;  // Returning null in case of an error
        } finally {
            set({ isUpdating: false });
        }
    },

    DeleteRequest: async (deleteRequest) => {
        try {
            set({ isDeleteingRequest: true });
            const res = await axiosInstance.post("/vehicle/vehicleDeleteRequest", deleteRequest);
            const data = res.data;

            if (data && data.success) {
                toast.success("Request Deleted successfully");
                return data;
            } else {
                const errorMessage = data?.message || "Failed to delete request";
                toast.error(errorMessage);
                return null;
            }

        } catch (error) {
            console.error("Error deleting request status:", error);
            toast.error("Failed to delete request status");
            return null;
        } finally {
            set({ isDeleteingRequest: false });
        }
    },

    bookVehicle: async (bookingData) => {
        try {
            set({ isBooking: true });
            const res = await axiosInstance.post("/vehicle/bookingVehicle", bookingData);
            const data = res.data;

            if (data?.success) {
                return { success: true };
            } else {
                return { success: false, message: data?.message || "Failed to book vehicle" };
            }
        } catch (error) {
            console.error("Booking API Error:", error);

            // Check if the error has a response (API error)
            if (error.response) {
                return { success: false, message: error.response.data?.message || "Something went wrong." };
            }

            // Fallback for network errors
            return { success: false, message: "Network error. Please try again." };
        } finally {
            set({ isBooking: false });
        }
    },

    cancelVehicle: async (bookingData) => {
        try {
            set({ isBookingCancel: true });
            const res = await axiosInstance.post("/vehicle/cancelBooking", bookingData);
            const data = res.data;

            if (data?.success) {
                return { success: true };
            } else {
                return { success: false, message: data?.message || "Failed to Cancel Booking" };
            }
        } catch (error) {
            console.error("cancel Booking API Error:", error);

            // Check if the error has a response (API error)
            if (error.response) {
                return { success: false, message: error.response.data?.message || "Something went wrong." };
            }

            // Fallback for network errors
            return { success: false, message: "Network error. Please try again." };
        } finally {
            set({ isBookingCancel: false });
        }
    },

    getVehicleHistory: async (request) => {
        try {
            const res = await axiosInstance.post("/vehicle/viewHistory", request); // Adjust the endpoint if needed
            const data = res.data;

            if (data?.success && Array.isArray(data.bookingDetails)) {  // ✅ Corrected this line
                set({
                    totalBookings: data.totalBookings, // Store total bookings count
                    bookingDetails: data.bookingDetails, // Store the fetched booking data
                });

            } else {
                console.error("❌ Invalid response structure for booking history:", data);
                toast.error("Received invalid booking data");
            }
        } catch (error) {
            console.error("❌ Error fetching booking history:", error);
            toast.error("Failed to fetch booking history");
        }
    },
    getBookingAnalytics: async (request) => {
        try {
            const res = await axiosInstance.post("/vehicle/getBookingAnalytics", request);

            if (res.status !== 200) {
                console.error(`❌ API responded with status ${res.status}:`, res.data);
                toast.error(`Error: Unexpected API response (${res.status})`);
                return;
            }

            const data = res.data;

            if (data?.success) {
                set({
                    totalBookings: data.statusStats?.reduce((acc, stat) => acc + stat.count, 0) || 0, // Summing up all booking statuses
                    utilizationStats: data.utilizationStats || [],
                    ownVehicleStats: data.ownVehicleStats || []
                });

            } else {
                console.warn("⚠️ Unexpected response format:", data);
                toast.error("Received invalid booking data format");
            }
        } catch (error) {
            if (error.response) {
                console.error(`❌ API Error [${error.response.status}]:`, error.response.data);
                toast.error(`API Error: ${error.response.data?.message || "Unknown error"}`);
            } else if (error.request) {
                console.error("🚫 No response from server:", error.request);
                toast.error("No response from server. Check your internet connection.");
            } else {
                console.error("❌ Request Error:", error.message);
                toast.error("Unexpected error occurred.");
            }
        }
    },

    exportAnalyticsReport: async (request) => {
        try {
            const res = await axiosInstance.post("/vehicle/exportAnalyticsReport", request, {
                responseType: 'blob', // Ensures response is handled as a file
            });

            if (res.status !== 200) {
                console.error(`❌ API responded with status ${res.status}:`, res.data);
                toast.error(`Error: Unexpected API response (${res.status})`);
                return;
            }

            const blob = new Blob([res.data], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "analytics_report.csv";
            document.body.appendChild(a);
            a.click();
            a.remove();

            toast.success("Analytics report downloaded!");

        } catch (error) {
            if (error.response) {
                console.error(`❌ API Error [${error.response.status}]:`, error.response.data);
                toast.error(`API Error: ${error.response.data?.message || "Unknown error"}`);
            } else if (error.request) {
                console.error("🚫 No response from server:", error.request);
                toast.error("No response from server. Check your internet connection.");
            } else {
                console.error("❌ Request Error:", error.message);
                toast.error("Unexpected error occurred.");
            }
        }
    },


}));
