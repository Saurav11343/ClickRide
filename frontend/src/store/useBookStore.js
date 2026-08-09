import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../lib/apiError.js";

export const useBookStore = create((set) => ({
    isBookMark: false,
    isUnBookMark: false,
    isBookmarked: false,
    bookmarks: [],

    // Function to bookmark a vehicle
    setbookmark: async (data) => {
        try {
            const res = await axiosInstance.post("/book/setBookmark", data);

            if (res.data.success) {
                set({ isBookMark: true });
                toast.success("Vehicle bookmarked successfully!");
            } else {
                toast.error(res.data.message);
            }
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Failed to bookmark vehicle"));
        }
    },

    // Function to remove a bookmark
    unsetbookmark: async (data) => {
        try {
            const res = await axiosInstance.post("/book/unsetBookmark", data);

            if (res.data.success) {
                set({ isUnBookMark: true });
                toast.success("Bookmark removed successfully!");
            } else {
                toast.error(res.data.message);
            }
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Failed to remove bookmark"));
        }
    },

    checkBookmark: async (data) => {
        try {
            const res = await axiosInstance.post("/book/checkBookmark", data);
            if (res.data.isBookmarked) {
                return true;
            } else {
                return false;
            }
        } catch {
            return false;
        }
    },

    fetchAllBookmarks: async (data) => {
        try {
            const res = await axiosInstance.post("/book/fetchAllBookmarks", data);

            if (res.data.bookmarks && res.data.bookmarks.length > 0) {
                set({ bookmarks: res.data.bookmarks }); // Store bookmarks in Zustand state
            } else {
                set({ bookmarks: [] }); // Ensure bookmarks state is empty if none are found
            }
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Failed to fetch bookmarks"));
        }
    },

    verifyRide: async (data) => {
        try {
            const res = await axiosInstance.post("/book/verifyRide", data);
            return res.data; // Return response data
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Failed to verify ride"));
            throw error; // Rethrow error for handling in the calling function
        }
    },

    UnverifyRide: async (data) => {
        try {
            const res = await axiosInstance.post("/book/UnverifyRide", data);
            return res.data; // Return response data
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Failed to cancel ride verification"));
            throw error; // Rethrow error for handling in the calling function
        }
    },

    checkBookStatus: async (data) => {
        try {
            const res = await axiosInstance.post("/book/checkBookStatus", data);
            return res.data; // Return the response data to the caller
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Failed to fetch booking status"));

            throw error; // Rethrow the error so the calling function can handle it
        }
    }


}));
