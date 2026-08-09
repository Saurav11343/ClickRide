import toast from "react-hot-toast";
import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import { getApiErrorMessage } from "../lib/apiError.js";

const emptySession = {
  authUser: null,
  UserRole: null,
  firstLogin: false,
};

const sessionFromUser = (user) => ({
  authUser: user,
  UserRole: user.roleName,
  firstLogin: Boolean(user.mustChangePassword),
});

export const useAuthStore = create((set) => ({
  ...emptySession,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isUpdatingPassword: false,
  totalCustomers: 0,
  totalPartners: 0,
  customerDetails: [],
  partnerDetails: [],

  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const { data } = await axiosInstance.get("/auth/check");
      set(sessionFromUser(data));
      return data;
    } catch {
      set(emptySession);
      return null;
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (input) => {
    set({ isSigningUp: true });
    try {
      const { data } = await axiosInstance.post("/auth/signup", input);
      set(sessionFromUser(data));
      toast.success("Account successfully created");
      return { success: true, user: data };
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Signup failed"));
      return { success: false };
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (input) => {
    set({ isLoggingIn: true });
    try {
      const { data } = await axiosInstance.post("/auth/login", input);
      set(sessionFromUser(data));
      toast.success("Successfully logged in");
      return data;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Login failed"));
      return null;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set(emptySession);
      toast.success("Successfully logged out");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Logout failed"));
    }
  },

  updateProfilepic: async (input) => {
    set({ isUpdatingProfile: true });
    try {
      const { data } = await axiosInstance.put("/auth/updateProfile", input);
      set((state) => ({ ...sessionFromUser(data), UserRole: data.roleName || state.UserRole }));
      toast.success("Profile updated successfully");
      return data;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Profile update failed"));
      return null;
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  fetchUserData: async () => {
    try {
      const { data } = await axiosInstance.get("/auth/users");
      set({
        totalCustomers: data.totalCustomers,
        totalPartners: data.totalPartners,
        customerDetails: data.customerDetails,
        partnerDetails: data.partnerDetails,
      });
      return data;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to fetch user data"));
      return null;
    }
  },

  updatePassword: async (input) => {
    set({ isUpdatingPassword: true });
    try {
      const { data } = await axiosInstance.post("/auth/updatePassword", input);
      set((state) => ({ ...sessionFromUser(data), UserRole: data.roleName || state.UserRole }));
      toast.success("Password updated successfully");
      return data;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Password update failed"));
      return null;
    } finally {
      set({ isUpdatingPassword: false });
    }
  },
}));
