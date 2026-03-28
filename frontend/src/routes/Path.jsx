import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home/Home";
import Signup from "../pages/Signup/Signup";
import Login from "../pages/Login/Login";
import { useAuthStore } from "../store/useAuthStore";
import Pricing from "../pages/Pricing/Pricing";
import Career from "../pages/Pricing/Career/Career";
import AboutUs from "../pages/About/AboutUs";
import PartnerSignup from "../pages/Signup/PartnerSignup";
import Profile from "../component/Profile/Profile";
import AdminDashboard from "../pages/Admin/AdminDashboard";
import UserDashboard from "../pages/Admin/UserDashboard/UserDashboard";
import VehicleDashboard from "../pages/Vehicle/VehicleDashboard";
import AddVehicle from "../pages/Vehicle/AddVehicle";
import ManageVehicle from "../pages/Vehicle/manageVehicle";
import VehicleModel from "../pages/Vehicle/VehicleModel";
import ManageModel from "../pages/Vehicle/ManageModel";
import DeleteModel from "../pages/Vehicle/DeleteModel";
import PartnerRequest from "../pages/Partner/PartnerRequest";
import ManagePartner from "../pages/Partner/ManagePartner";
import PartnerDashboard from "../pages/Partner/PartnerDashboard";
import Password from "../component/Password/Password";
import PartnerVehicleDashboard from "../pages/Partner/PartnerVehicleDashboard";
import RoleBasedLayout from "../component/layout/RoleBasedLayout";
import FilterVehicles from "../component/Filter/FilterVehicles";
import PartnerVehicelUpdateRequest from "../pages/Partner/PartnerVehicelUpdateRequest";
import ViewVehicle from "../pages/Customer/ViewVehicle";
import VehicleDetails from "../pages/Customer/VehicleDetails";
import Booking from "../pages/booking/Booking";
import History from "../pages/booking/History";
import BookingDetailsPage from "../pages/booking/BookingDetailsPage";
import VehicleAnalytics from "../pages/Vehicle/VehicleAnalytics";
import AnalyticsDashboard from "../pages/Vehicle/AnalyticsDashboard";
import AdminAnalyticsPage from "../pages/Analytics/AdminAnalyticsPage";
import Bookmark from "../pages/booking/Bookmark";
import VerifyVehicle from "../pages/Vehicle/VerifyVehicle";
import PartnerAnalyticsPage from "../pages/Analytics/PartnerAnalyticsPage";

export default function Path() {
  const { authUser, checkAuth, isCheckingAuth, UserRole, firstLogin } =
    useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/VehicleAnalytics" element={<VehicleAnalytics />} />
          <Route path="/AnalyticsDashboard" element={<AnalyticsDashboard />} />

          <Route path="/AdminAnalyticsPage" element={<AdminAnalyticsPage />} />
          <Route
            path="/PartnerAnalyticsPage"
            element={<PartnerAnalyticsPage />}
          />
          <Route path="/Bookmark" element={<Bookmark />} />

          {/* ===== Public Routes ===== */}
          <Route path="/" element={<Home />} />
          <Route path="/Signup" element={<Signup />} />
          <Route path="/PartnerSignup" element={<PartnerSignup />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/Pricing" element={<Pricing />} />
          <Route path="/Career" element={<Career />} />
          <Route path="/About" element={<AboutUs />} />

          <Route path="/ViewVehicle" element={<ViewVehicle />} />

          <Route
            path="/VehicleDetails/:vehicleID"
            element={authUser ? <VehicleDetails /> : <Navigate to="/Login" />}
          />
          <Route
            path="/booking/:vehicleID"
            element={
              authUser && UserRole === "Customer" ? (
                <Booking />
              ) : (
                <Navigate to="/Login" />
              )
            }
          />

          <Route
            path="/Profile"
            element={authUser ? <Profile /> : <Navigate to="/Login" />}
          />
          <Route
            path="/Password"
            element={authUser ? <Password /> : <Navigate to="/Login" />}
          />

          {/* ===== Admin Routes ===== */}
          <Route
            path="/Admin"
            element={
              authUser && UserRole === "Admin" ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/Login" />
              )
            }
          />
          <Route
            path="/UserDashboard"
            element={
              authUser && UserRole === "Admin" ? (
                <UserDashboard />
              ) : (
                <Navigate to="/Login" />
              )
            }
          />
          <Route
            path="/VehicleDashboard"
            element={
              authUser && UserRole === "Admin" ? (
                <VehicleDashboard />
              ) : (
                <Navigate to="/Login" />
              )
            }
          />
          <Route
            path="/PartnerRequest"
            element={
              authUser && UserRole === "Admin" ? (
                <PartnerRequest />
              ) : (
                <Navigate to="/Login" />
              )
            }
          />
          <Route
            path="/ManagePartner/:PartnerId"
            element={
              authUser && UserRole === "Admin" ? (
                <ManagePartner />
              ) : (
                <Navigate to="/Login" />
              )
            }
          />

          <Route
            path="/ViewHistory"
            element={
              authUser ? (
                <RoleBasedLayout UserRole={UserRole}>
                  <History />{" "}
                </RoleBasedLayout>
              ) : (
                <Navigate to="/Login" />
              )
            }
          />

          {/* ===== Partner Routes ===== */}
          <Route
            path="/Partner"
            element={
              authUser && UserRole === "Partner" ? (
                firstLogin ? (
                  <Navigate to="/Password" />
                ) : (
                  <PartnerDashboard />
                )
              ) : (
                <Navigate to="/Login" />
              )
            }
          />

          <Route
            path="/PartnerVehicleDashboard"
            element={
              authUser && UserRole === "Partner" ? (
                firstLogin ? (
                  <Navigate to="/Password" />
                ) : (
                  <PartnerVehicleDashboard />
                )
              ) : (
                <Navigate to="/Login" />
              )
            }
          />

          {/* ===== Vehicle Management (Shared Between Admin & Partner) ===== */}
          <Route
            path="/AddVehicle"
            element={
              authUser && (UserRole === "Admin" || UserRole === "Partner") ? (
                <RoleBasedLayout UserRole={UserRole}>
                  <AddVehicle />{" "}
                </RoleBasedLayout>
              ) : (
                <Navigate to="/Login" />
              )
            }
          />
          <Route
            path="/VehicleManage/:vehicleId"
            element={
              authUser && (UserRole === "Admin" || UserRole === "Partner") ? (
                <RoleBasedLayout UserRole={UserRole}>
                  <ManageVehicle />
                </RoleBasedLayout>
              ) : (
                <Navigate to="/Login" />
              )
            }
          />
          <Route
            path="/VerifyVehicle/:vehicleId"
            element={
              authUser && (UserRole === "Admin" || UserRole === "Partner") ? (
                <RoleBasedLayout UserRole={UserRole}>
                  <VerifyVehicle />
                </RoleBasedLayout>
              ) : (
                <Navigate to="/Login" />
              )
            }
          />

          <Route
            path="/PartnerVehicleUpdateRequest"
            element={
              authUser && (UserRole === "Admin" || UserRole === "Partner") ? (
                <RoleBasedLayout UserRole={UserRole}>
                  <PartnerVehicelUpdateRequest />
                </RoleBasedLayout>
              ) : (
                <Navigate to="/Login" />
              )
            }
          />

          {/* ===== Vehicle Model Management ===== */}
          <Route
            path="/VehicleModel/:modelId"
            element={authUser ? <VehicleModel /> : <Navigate to="/Login" />}
          />
          <Route
            path="/ManageModel"
            element={authUser ? <ManageModel /> : <Navigate to="/Login" />}
          />
          <Route
            path="/ManageModel/:ModelId"
            element={authUser ? <DeleteModel /> : <Navigate to="/Login" />}
          />

          <Route
            path="/FilteredVehicles"
            element={authUser ? <FilterVehicles /> : <Navigate to="/Login" />}
          />

          <Route
            path="/bookingDetails/:bookingID"
            element={
              authUser ? <BookingDetailsPage /> : <Navigate to="/Login" />
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}
