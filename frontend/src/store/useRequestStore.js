import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../lib/apiError.js";

export const useRequestStore = create((set) => ({
    isVerified: false,
    isCancel: false,

    // Function to verify a vehicle
    verifiedVehicle: async (data) => {
        try {
            const res = await axiosInstance.post("/request/verifiedVehicle", data);

            if (res.status === 200) {
                set({ isVerified: true });
                toast.success("Vehicle verified successfully!");
            }
            return res;
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Failed to verify vehicle"));
        }
    },

    // Function to cancel a vehicle request
    cancelledVehicle: async (data) => {
        try {
            const res = await axiosInstance.post("/request/cancelledVehicle", data);

            if (res.status === 200) {
                set({ isCancel: true });
                toast.success("Vehicle request cancelled successfully!");
            }
            return res;
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Failed to cancel vehicle request"));
        }
    },

    fetchAllVehicleRequest: async () => {
        const res = await axiosInstance.get("/request/fetchAllVehicleRequest");
        return res.data;
    }

}));
