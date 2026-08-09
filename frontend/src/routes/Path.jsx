import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import RoleBasedLayout from "../component/layout/RoleBasedLayout";
import { useAuthStore } from "../store/useAuthStore";

const AboutUs = lazy(() => import("../pages/About/AboutUs"));
const AddVehicle = lazy(() => import("../pages/Vehicle/AddVehicle"));
const AdminAnalyticsPage = lazy(() => import("../pages/Analytics/AdminAnalyticsPage"));
const AdminDashboard = lazy(() => import("../pages/Admin/AdminDashboard"));
const AnalyticsDashboard = lazy(() => import("../pages/Vehicle/AnalyticsDashboard"));
const Booking = lazy(() => import("../pages/booking/Booking"));
const BookingDetailsPage = lazy(() => import("../pages/booking/BookingDetailsPage"));
const Bookmark = lazy(() => import("../pages/booking/Bookmark"));
const Career = lazy(() => import("../pages/Pricing/Career/Career"));
const DeleteModel = lazy(() => import("../pages/Vehicle/DeleteModel"));
const FilterVehicles = lazy(() => import("../component/Filter/FilterVehicles"));
const History = lazy(() => import("../pages/booking/History"));
const Home = lazy(() => import("../pages/Home/Home"));
const Login = lazy(() => import("../pages/Login/Login"));
const ManageModel = lazy(() => import("../pages/Vehicle/ManageModel"));
const ManagePartner = lazy(() => import("../pages/Partner/ManagePartner"));
const ManageVehicle = lazy(() => import("../pages/Vehicle/manageVehicle"));
const PartnerAnalyticsPage = lazy(() => import("../pages/Analytics/PartnerAnalyticsPage"));
const PartnerDashboard = lazy(() => import("../pages/Partner/PartnerDashboard"));
const PartnerRequest = lazy(() => import("../pages/Partner/PartnerRequest"));
const PartnerSignup = lazy(() => import("../pages/Signup/PartnerSignup"));
const PartnerVehicleDashboard = lazy(() => import("../pages/Partner/PartnerVehicleDashboard"));
const PartnerVehicleUpdateRequest = lazy(() => import("../pages/Partner/PartnerVehicelUpdateRequest"));
const Password = lazy(() => import("../component/Password/Password"));
const Pricing = lazy(() => import("../pages/Pricing/Pricing"));
const Profile = lazy(() => import("../component/Profile/Profile"));
const Signup = lazy(() => import("../pages/Signup/Signup"));
const UserDashboard = lazy(() => import("../pages/Admin/UserDashboard/UserDashboard"));
const VehicleAnalytics = lazy(() => import("../pages/Vehicle/VehicleAnalytics"));
const VehicleDashboard = lazy(() => import("../pages/Vehicle/VehicleDashboard"));
const VehicleDetails = lazy(() => import("../pages/Customer/VehicleDetails"));
const VehicleModel = lazy(() => import("../pages/Vehicle/VehicleModel"));
const VerifyVehicle = lazy(() => import("../pages/Vehicle/VerifyVehicle"));
const ViewVehicle = lazy(() => import("../pages/Customer/ViewVehicle"));

const RouteLoader = () => (
  <div className="grid min-h-screen place-items-center bg-slate-950 text-cyan-300" role="status">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
    <span className="sr-only">Loading page</span>
  </div>
);

export default function Path() {
  const { authUser, UserRole, firstLogin } = useAuthStore();
  const authenticated = (element) => authUser ? element : <Navigate to="/Login" replace />;
  const allowed = (roles, element) =>
    authUser && roles.includes(UserRole) ? element : <Navigate to="/Login" replace />;
  const withLayout = (element) => (
    <RoleBasedLayout UserRole={UserRole}>{element}</RoleBasedLayout>
  );
  const fleetPage = (element) => allowed(["Admin", "Partner"], withLayout(element));
  const partnerPage = (element) =>
    allowed(["Partner"], firstLogin ? <Navigate to="/Password" replace /> : element);

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Signup" element={<Signup />} />
          <Route path="/PartnerSignup" element={<PartnerSignup />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/Pricing" element={<Pricing />} />
          <Route path="/Career" element={<Career />} />
          <Route path="/About" element={<AboutUs />} />
          <Route path="/ViewVehicle" element={<ViewVehicle />} />

          <Route path="/VehicleDetails/:vehicleID" element={authenticated(<VehicleDetails />)} />
          <Route path="/FilteredVehicles" element={authenticated(<FilterVehicles />)} />
          <Route path="/Profile" element={authenticated(<Profile />)} />
          <Route path="/Password" element={authenticated(<Password />)} />
          <Route path="/VehicleModel/:modelId" element={authenticated(<VehicleModel />)} />
          <Route path="/bookingDetails/:bookingID" element={authenticated(<BookingDetailsPage />)} />
          <Route path="/ViewHistory" element={authenticated(withLayout(<History />))} />

          <Route path="/booking/:vehicleID" element={allowed(["Customer"], <Booking />)} />
          <Route path="/Bookmark" element={allowed(["Customer"], <Bookmark />)} />

          <Route path="/Admin" element={allowed(["Admin"], <AdminDashboard />)} />
          <Route path="/UserDashboard" element={allowed(["Admin"], <UserDashboard />)} />
          <Route path="/VehicleDashboard" element={allowed(["Admin"], <VehicleDashboard />)} />
          <Route path="/PartnerRequest" element={allowed(["Admin"], <PartnerRequest />)} />
          <Route path="/ManagePartner/:PartnerId" element={allowed(["Admin"], <ManagePartner />)} />
          <Route path="/AdminAnalyticsPage" element={allowed(["Admin"], <AdminAnalyticsPage />)} />
          <Route path="/ManageModel" element={allowed(["Admin"], <ManageModel />)} />
          <Route path="/ManageModel/:ModelId" element={allowed(["Admin"], <DeleteModel />)} />

          <Route path="/Partner" element={partnerPage(<PartnerDashboard />)} />
          <Route path="/PartnerVehicleDashboard" element={partnerPage(<PartnerVehicleDashboard />)} />
          <Route path="/PartnerAnalyticsPage" element={partnerPage(<PartnerAnalyticsPage />)} />

          <Route path="/AddVehicle" element={fleetPage(<AddVehicle />)} />
          <Route path="/VehicleManage/:vehicleId" element={fleetPage(<ManageVehicle />)} />
          <Route path="/VerifyVehicle/:vehicleId" element={fleetPage(<VerifyVehicle />)} />
          <Route path="/PartnerVehicleUpdateRequest" element={fleetPage(<PartnerVehicleUpdateRequest />)} />
          <Route path="/VehicleAnalytics" element={fleetPage(<VehicleAnalytics />)} />
          <Route path="/AnalyticsDashboard" element={fleetPage(<AnalyticsDashboard />)} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
