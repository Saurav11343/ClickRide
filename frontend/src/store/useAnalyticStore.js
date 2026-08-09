import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../lib/apiError.js";

export const useAnalyticStore = create((set) => ({
    isLoading: false,
    analyticsData: null,

    adminAnalysis: async () => {
        set({ isLoading: true });
        try {
            const res = await axiosInstance.get("/analytics/getAdminAnalytics");
            set({ analyticsData: res.data });
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Failed to fetch admin analytics"));
        } finally {
            set({ isLoading: false });
        }
    },

    partneranalysis: async () => {
        set({ isLoading: true });
        try {
            const res = await axiosInstance.get("/analytics/getPartnerAnalytics");
            set({ analyticsData: res.data });
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Failed to fetch partner analytics"));
        } finally {
            set({ isLoading: false });
        }
    }
    
}));
