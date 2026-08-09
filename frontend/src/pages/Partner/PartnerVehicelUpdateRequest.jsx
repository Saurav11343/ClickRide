import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useVehicleStore } from "../../store/useVehicleStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useRequestStore } from "../../store/useRequestStore";
import toast from "react-hot-toast";
import { Loader, AlertCircle, CheckCircle, Clock, ArrowRight, X, Trash2 } from "lucide-react";

export default function PartnerVehicleUpdateRequest() {
    const navigate = useNavigate();
    const { authUser, UserRole, checkAuth } = useAuthStore();
    const {
        fetchVehicleUpdateRequestData,
        totalUpdateResponce,
        fetchVehicleData,
        DeleteRequest,
        isDeleteingRequest,
    } = useVehicleStore();

    const {
        fetchAllVehicleRequest
    } = useRequestStore();

    const [profileData, setProfileData] = useState({
        userId: authUser?._id || "",
    });

    const [selectedMessage, setSelectedMessage] = useState("");
    const [selectedVehiclePic, setSelectedVehiclePic] = useState("");
    const [selectedRegNum, setSelectedRegNum] = useState("");
    const [selectedRequestedBy, setSelectedRequestedBy] = useState("");
    const [selectedRole, setSelectedRole] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [selectedUser, setSelectedUser] = useState("");
    const [selectedRequestID, setSelectedRequestId] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [requestData, setRequestData] = useState("");
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        if (authUser) {
            setProfileData({
                userId: authUser?._id || "",
            });
        }
    }, [authUser]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const requestData = await fetchAllVehicleRequest();
                setRequestData(requestData)
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, [fetchAllVehicleRequest]);



    // Filter requests dynamically based on role
    const myRequest = (Array.isArray(requestData.requests) ? requestData.requests : []).filter((request) => {
        if (UserRole === "Admin") {
            return request.status === "pending" || request.status === "review" || request.status === "approved";
        } else if (UserRole === "Partner") {
            return (
                (request.status === "pending" || request.status === "review" || request.status === "approved") &&
                request.vehicleId.owner === profileData.userId
            );
        }
        return false;
    });

    // Categorize Requests
    const pendingRequests = myRequest.filter(request => request.status === "pending");
    const reviewRequests = myRequest.filter(request => request.status === "review");
    const solvedRequests = myRequest.filter(request => request.status === "approved")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Open Modal Function
    const openModal = (message, vehiclePic, regNum, requestedBy, role, status, requestId) => {
        setSelectedMessage(message);
        setSelectedVehiclePic(vehiclePic);
        setSelectedRegNum(regNum);
        setSelectedRequestedBy(requestedBy);
        setSelectedRole(role);
        setSelectedStatus(status);
        setSelectedRequestId(requestId);
        setSelectedUser(UserRole);
        setIsModalOpen(true);
    };

    // Close Modal Function
    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedMessage("");
        setSelectedVehiclePic("");
        setSelectedRegNum("");
        setSelectedRequestedBy("");
        setSelectedRole("");
        setSelectedStatus("");
        setSelectedUser("");
    };

    const handleDelete = async () => {
        try {
            if (!selectedRequestID) {
                toast.error("Invalid request ID.");
                return;
            }

            const data = {
                requestID: selectedRequestID
            }
            const deleteResponse = await DeleteRequest(data);
            if (deleteResponse?.success) {
                await fetchVehicleUpdateRequestData();
                await fetchVehicleData();
                toast.success("Request deleted successfully");
            }
            closeModal();
            navigate("/PartnerVehicleUpdateRequest");
        } catch (error) {
            console.error("Error deleting request:", error);
            toast.error("Error deleting request.");
            closeModal();
            navigate("/PartnerVehicleUpdateRequest");
        }
    };

    // Status Badge Component
    const StatusBadge = ({ status }) => {
        let bgColor = "bg-gray-200";
        let textColor = "text-gray-800";
        let icon = <Clock className="h-4 w-4 mr-1" />;

        if (status === "pending") {
            bgColor = "bg-yellow-100";
            textColor = "text-yellow-800";
            icon = <Clock className="h-4 w-4 mr-1" />;
        } else if (status === "review") {
            bgColor = "bg-blue-100";
            textColor = "text-blue-800";
            icon = <AlertCircle className="h-4 w-4 mr-1" />;
        } else if (status === "approved") {
            bgColor = "bg-green-100";
            textColor = "text-green-800";
            icon = <CheckCircle className="h-4 w-4 mr-1" />;
        }

        return (
            <span className={`${bgColor} ${textColor} flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full`}>
                {icon}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    // Request Card Component
    const RequestCard = ({ request }) => {
        const isClickable = (
            (UserRole === "Partner" &&
                ((request.requestType === "Add" && request.status !== "pending" && request.status !== "review" && request.status !== "approved") ||  // Allow "Add" requests if pending
                    (request.requestType === "Update" && request.status === "pending" && request.status !== "review" && request.status !== "approved"))) ||
            (UserRole === "Admin" && request.status !== "approved")
        );

        return (
            <div
                role={isClickable ? "button" : ""}
                onClick={() => {
                    if (isClickable) {
                        if (request.requestType === "Add") {
                            navigate(`/verifyVehicle/${request.vehicleId._id}`, {
                                state: {
                                    requestId: request._id,
                                    requestStatus: request.status,
                                },
                            });
                        } else {
                            navigate(`/VehicleManage/${request.vehicleId._id}`, {
                                state: {
                                    requestId: request._id,
                                    requestStatus: request.status,
                                },
                            });
                        }
                    }

                }}
                className={`flex items-center space-x-4 bg-white border border-gray-200 rounded-lg shadow-md p-4 transition-all duration-300 ${isClickable ? "hover:shadow-lg hover:border-blue-300 cursor-pointer" : ""
                    }`}
            >
                {/* Vehicle Image */}
                <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border border-gray-200">
                    <img
                        alt={`Model: ${request?.vehicleId?.vehicleRegNumber}`}
                        src={request.vehicleId?.vehicleImagesId?.VehicleFrontPic || "/default.jpg"}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Details Section */}
                <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-900 truncate">{request?.vehicleId?.vehicleRegNumber}</h3>
                        <StatusBadge status={request.status} />
                    </div>

                    <div className="text-sm text-gray-600">
                        <p className="truncate">
                            {new Date(request.createdAt).toLocaleDateString()}{" "}
                            {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </p>
                    </div>
                </div>

                {/* View Message Button */}
                <button
                    className="flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors px-3 py-1 rounded hover:bg-blue-50"
                    onClick={(e) => {
                        e.stopPropagation(); // Prevents parent from handling the click
                        openModal(
                            request.requestMessage,
                            request.vehicleId.vehicleImagesId.VehicleFrontPic,
                            request.vehicleId.vehicleRegNumber,
                            request.requestedBy.email,
                            request.requestedBy.roleId.roleName,
                            request.status,
                            request._id,
                        );
                    }}
                >
                    View <ArrowRight className="ml-1 h-4 w-4" />
                </button>
            </div>
        );
    };

    // Dashboard Section Component
    const DashboardSection = ({ title, data, icon, bgColor, textColor }) => (
        <div className="bg-white lg:col-span-2 md:col-span-1 sm:col-span-1 rounded-xl shadow-md overflow-hidden border border-gray-100">
            <div className="sticky top-0 z-10 bg-white p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        {icon}
                        <span className="ml-2">{title}</span>
                    </h3>
                    <span className={`${bgColor} ${textColor} px-3 py-1 rounded-full text-sm font-medium`}>
                        {data.length}
                    </span>
                </div>
            </div>
            <div className="overflow-y-auto scrollbar-hide" style={{ maxHeight: '500px' }}>
                <div className="grid grid-cols-1 gap-3 p-4">
                    {data.length > 0 ? (
                        data.map((request) => <RequestCard key={request._id} request={request} />)
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                            <div className="bg-gray-100 p-3 rounded-full mb-3">
                                {icon}
                            </div>
                            <p>No {title} found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-gray-50 min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Vehicle Update Requests Dashboard</h1>

                {/* Stats Overview */}
                <div className="grid lg:grid-cols-3 md:grid-cols-3 sm:grid-cols-1 gap-5 mb-6">
                    <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-yellow-400">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Pending Requests</p>
                                <h2 className="text-3xl font-bold text-gray-800">{pendingRequests.length || 0}</h2>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-full">
                                <Clock className="h-6 w-6 text-yellow-500" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-400">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Pending Approval</p>
                                <h2 className="text-3xl font-bold text-gray-800">{reviewRequests.length || 0}</h2>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <AlertCircle className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-400">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Solved Requests</p>
                                <h2 className="text-3xl font-bold text-gray-800">{solvedRequests.length || 0}</h2>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <CheckCircle className="h-6 w-6 text-green-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Requests Columns */}
                <div className="grid lg:grid-cols-6 md:grid-cols-3 sm:grid-cols-1 gap-6">
                    <DashboardSection
                        title="Pending Requests"
                        data={pendingRequests}
                        icon={<Clock className="h-5 w-5 text-yellow-500" />}
                        bgColor="bg-yellow-100"
                        textColor="text-yellow-800"
                    />

                    <DashboardSection
                        title="Pending Approval"
                        data={reviewRequests}
                        icon={<AlertCircle className="h-5 w-5 text-blue-500" />}
                        bgColor="bg-blue-100"
                        textColor="text-blue-800"
                    />

                    <DashboardSection
                        title="Solved Requests"
                        data={solvedRequests}
                        icon={<CheckCircle className="h-5 w-5 text-green-500" />}
                        bgColor="bg-green-100"
                        textColor="text-green-800"
                    />
                </div>
            </div>

            {/* Modal Component */}
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 transition-opacity duration-300" onClick={closeModal}>
                    <div className="bg-white rounded-lg p-0 max-w-md w-full transition-all duration-300 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800">Request Details</h3>
                            <button
                                onClick={closeModal}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Request Details Section */}
                        <div className="p-4">
                            {/* Vehicle Image */}
                            <div className="w-full h-48 bg-gray-200 rounded-md overflow-hidden mb-4">
                                <img
                                    alt={`Vehicle: ${selectedRegNum}`}
                                    src={selectedVehiclePic || "/default.jpg"}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Status Badge */}
                            <div className="mb-4">
                                <StatusBadge status={selectedStatus || "pending"} />
                            </div>

                            {/* Vehicle Details */}
                            <div className="grid grid-cols-1 gap-3 mb-4">
                                <div className="bg-gray-50 p-3 rounded-md">
                                    <div className="text-sm text-gray-500">Registration Number</div>
                                    <div className="font-medium text-gray-900">{selectedRegNum || "Not Available"}</div>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-md">
                                    <div className="text-sm text-gray-500">Requested By</div>
                                    <div className="font-medium text-gray-900">{selectedRequestedBy || "Not Available"}</div>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-md">
                                    <div className="text-sm text-gray-500">Role</div>
                                    <div className="font-medium text-gray-900">{selectedRole || "Not Available"}</div>
                                </div>
                            </div>

                            {/* Request Message */}
                            <div className="mb-6">
                                <h4 className="text-sm text-gray-500 mb-1">Request Message</h4>
                                <div className="p-3 bg-blue-50 text-blue-800 rounded-md">
                                    {selectedMessage || "No message provided"}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-4">
                                <button
                                    className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition font-medium"
                                    onClick={closeModal}
                                >
                                    Close
                                </button>

                                {/* Delete Request button only if user is admin and status is 'pending' or 'review' */}
                                {UserRole === "Admin" && (selectedStatus === "pending" || selectedStatus === "review") && (
                                    <button
                                        className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition font-medium disabled:opacity-50"
                                        onClick={handleDelete}
                                        disabled={isDeleteingRequest}
                                    >
                                        {isDeleteingRequest ? (
                                            <Loader className="h-5 w-5 animate-spin mr-2" />
                                        ) : (
                                            <Trash2 className="h-5 w-5 mr-2" />
                                        )}
                                        Delete Request
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
