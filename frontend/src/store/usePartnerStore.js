import { create } from "zustand"
import { axiosInstance } from "../lib/axios.js"
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../lib/apiError.js";


export const usePartnerStore = create((set) => ({
    authUser: null,
    isSigningUp: false,
    isRejecting: false,
    isValidating: false,


    partnerSignup: async (data) => {
        try {
            set({ isSigningUp: true });
            const res = await axiosInstance.post("/partner/partnerSignup", data);
            set({ authUser: res.data });
            toast.success("Account successfully created")
            return { success: true };
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Partner signup failed"));
            return { success: false };

        } finally {
            set({ isSigningUp: false });
        }
    },
    fetchPartnerData: async () => {
        try {
            const res = await axiosInstance.get("/partner/partnerRequest"); // Adjust the endpoint as needed
            const data = res.data;

            set({
                totalPartnerRequest: data.totalPartnerRequest,
                partnerRequestDetails: data.partnerRequestDetails,
            });
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Failed to fetch partner requests"));
        }
    },
    rejectPartnerRequest: async (partnerID) => {
        try {
            set({ isRejecting: true });
            const res = await axiosInstance.post("/partner/deletePartnerRequest", { partnerID });

            // If you want to return specific data from the response
            return { success: true, data: res.data };
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Failed to delete partner request"));
            return { success: false };
        } finally {
            set({ isRejecting: false });
        }
    },
    validatePartnerRequest: async (partnerID) => {
        try {
            set({ isValidating: true });
            const res = await axiosInstance.post("/partner/validatePartnerRequest", { partnerID });
            return { success: true, data: res.data };
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Failed to validate partner request"));
            return { success: false };
        } finally {
            set({ isValidating: false });
        }
    }

}));
