import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Camera, Loader, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { yupResolver } from '@hookform/resolvers/yup';
import VehicleImageSlider from './vehicleImageSlider';
import { vehicleSchema } from '../../../../backend/src/validators/vehicle.validator';
import { useVehicleStore } from '../../store/useVehicleStore';
import { useAuthStore } from '../../store/useAuthStore';
import MapSelector from '../../component/Map/MapSelector';
export default function ManageVehicle() {
    const { vehicleId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const requestId = location.state?.requestId || null;
    const requestStatus = location.state?.requestStatus || null;
    const { isUpdating, isUpdatingVehicle, isRequesting, isDeletingVehicle, fetchOneVehicleData, totalUpdateResponce, fetchVehicleUpdateRequestData, UpdateOneVehicleData, DeleteOneVehicleData, UpdateRequestStatus, vehicleUpdateRequest } = useVehicleStore();
    const { authUser, UserRole } = useAuthStore();
    const [isMapOpen, setIsMapOpen] = useState(false);

    // Initialize the form using useForm; include reset method.
    const { control, handleSubmit, register, reset, setValue, watch, formState: { errors } } = useForm({
        resolver: yupResolver(vehicleSchema),
        defaultValues: {
            vehicleId: vehicleId || '',
            selectedImgs: [],
            vehicleType: '',
            vehicleMake: '',
            vehicleModel: '',
            vehicleSeat: '',
            vehicleTransmission: '',
            vehicleFuelType: '',
            vehicleRegNumber: '',
            manufacturingYear: 0,
            pricePerDay: 0,
            pricePerHour: 0,
            availabilityStatus: '',
            email: '',
            roleName: '',
            vehicleAddress: "",
            latitude: "",
            longitude: "",
            country: "",
            state: "",
            city: "",
            pincode: "",
        }
    });
    const [requestMessage, setRequestMessage] = useState("");
    const [isVehiclePicOpen, setIsVehiclePicOpen] = useState(false);
    const [isPendingRequest, setIsPendingRequest] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUpdateDone, setIsUpdateDone] = useState(false);
    const [requestData, setRequestData] = useState();
    const latitude = watch("latitude");
    const longitude = watch("longitude");
    const [isBooked, setIsBooked] = useState(false);

    useEffect(() => {
        setIsBooked(watch("availabilityStatus") === "Booked");
    }, [watch("availabilityStatus")]);

    const [profileData, setProfileData] = useState({
        email: authUser?.email || "",
        userId: authUser?._id || "",
    });

    useEffect(() => {
        fetchVehicleUpdateRequestData();
    }, [fetchVehicleUpdateRequestData]);

    useEffect(() => {
        if (authUser) {
            setProfileData((prev) => ({
                ...prev,
                email: authUser.email || "",
                userId: authUser._id || "",
            }));
        }
    }, [authUser]);

    useEffect(() => {
        if (!vehicleId) return;
        fetchOneVehicleData(vehicleId).then((data) => {
            const vehicleDetails = {
                vehicleId,
                selectedImgs: [
                    data.vehicleImagesId?.VehicleFrontPic || "/avatar.png",
                    data.vehicleImagesId?.VehicleBackPic || "/avatar.png",
                    data.vehicleImagesId?.VehicleSide1Pic || "/avatar.png",
                    data.vehicleImagesId?.VehicleSide2Pic || "/avatar.png",
                ],
                vehicleType: data.modelID?.vehicleType || "",
                vehicleMake: data.modelID?.vehicleMake || "",
                vehicleModel: data.modelID?.vehicleModel || "",
                vehicleSeat: data.vehicleSeat || "",
                vehicleTransmission: data.vehicleTransmission || "",
                vehicleFuelType: data.vehicleFuelType || "",
                vehicleRegNumber: data.vehicleRegNumber || "",
                manufacturingYear: data.manufacturingYear || "",
                pricePerDay: Number(data.pricePerDay?.$numberDecimal) || "",
                pricePerHour: Number(data.pricePerHour?.$numberDecimal) || "",
                availabilityStatus: data.availabilityStatus || "",
                email: data.owner?.email || "",
                roleName: data.owner?.roleId?.roleName || "",
                vehicleAddress: data.vehicleLocationId?.vehicleAddress || "",
                latitude: data.vehicleLocationId?.latitude || "",
                longitude: data.vehicleLocationId?.longitude || "",
                country: data.vehicleLocationId?.country || "",
                state: data.vehicleLocationId?.state || "",
                city: data.vehicleLocationId?.city || "",
                pincode: data.vehicleLocationId?.pincode || "",
            };
            reset(vehicleDetails);
        }).catch((error) => console.error("Error fetching vehicle data:", error));
    }, [vehicleId, fetchOneVehicleData, reset]);

    const handleToggleAvailability = () => {
        if (!isBooked) {
            const newStatus = watch("availabilityStatus") === "Available" ? "Unavailable" : "Available";
            setValue("availabilityStatus", newStatus);
        }
    };
    // Handle file input changes: update preview and form state.
    const handleImageChange = (e, index) => {
        const file = e.target.files[0];
        if (!file) return;

        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            toast.error('File size must be less than 2MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {

            const newSelectedImgs = [...watch("selectedImgs")];
            newSelectedImgs[index] = reader.result;
            setValue(`selectedImgs[${index}]`, reader.result);

        };
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        if (!totalUpdateResponce || !Array.isArray(totalUpdateResponce)) {
            console.log("Invalid or empty data received.");
            return;
        }

        // Find request message by requestId
        const foundRequest = totalUpdateResponce.find(response => response._id === requestId);
        if (foundRequest) {
            setRequestMessage(foundRequest.requestMessage);
        }


        // Find pending or review request for the given vehicleId
        const pendingRequest = totalUpdateResponce.find(request =>
            (request.status === "pending" || request.status === "review") &&
            request.vehicleId?._id?.toString() === vehicleId.toString()
        );

        setIsPendingRequest(prevState => {
            const newState = !!pendingRequest; // Ensures it's a boolean (true if found, false if not)
            return prevState !== newState ? newState : prevState;
        });
    }, [totalUpdateResponce, vehicleId, requestId]);

    const handleUpdate = async (data, e) => {
        e.preventDefault();  // Prevent default form submission

        try {
            // Prepare the formdata object with regular fields
            const formdata = {
                vehicleID: vehicleId,
                vehicleSeat: data.vehicleSeat,
                vehicleTransmission: data.vehicleTransmission,
                vehicleFuelType: data.vehicleFuelType,
                vehicleRegNumber: data.vehicleRegNumber,
                manufacturingYear: data.manufacturingYear,
                pricePerDay: data.pricePerDay,
                pricePerHour: data.pricePerHour,
                availabilityStatus: data.availabilityStatus,
                vehicleAddress: data.vehicleAddress,
                latitude: data.latitude,
                longitude: data.longitude,
                country: data.country,
                state: data.state,
                city: data.city,
                pincode: data.pincode,
            };

            // Check if selectedImgs array contains any values
            if (!data.selectedImgs || data.selectedImgs.length === 0) {
                console.log("No images to append!");
            } else {
                // Add images to the formdata if they are base64 strings or URLs
                formdata.selectedImgs = [];

                data.selectedImgs.forEach((img, index) => {
                    console.log("Processing image at index", index, ":", img);  // Debug log

                    if (img && img.startsWith('data:image')) {  // Check if it's a base64 string
                        console.log(`Appending base64 image at index ${index}:`, img);
                        formdata.selectedImgs.push(img);
                    } else if (img && img.startsWith('http')) {  // Check if it's a URL
                        console.log(`Appending image URL at index ${index}:`, img);
                        formdata.selectedImgs.push(img);
                    } else {
                        console.log(`Skipping invalid or empty value at index ${index}:`, img);
                    }
                });
            }

            // Log the formdata object before sending to the API
            console.log("FormData:", formdata);

            // Call the API function to update vehicle data
            const updatedVehicleData = await UpdateOneVehicleData(formdata);

            setIsUpdateDone(true);

            // Navigate if conditions are met
            if (UserRole === "Partner" && requestId) {
                navigate(`/PartnerVehicleUpdateRequest`);
            }
        } catch (error) {
            console.error("Error updating vehicle data:", error);
        }
    };

    const handleDelete = async (e) => {
        e.preventDefault();
        try {
            const formdata = {
                vehicleID: vehicleId,
            };

            // Call the API to delete the vehicle
            const deleteVehicleId = await DeleteOneVehicleData(formdata);

            if (deleteVehicleId && deleteVehicleId.success) {
                // Navigate based on user role after successful deletion
                if (UserRole === "Admin") {
                    navigate('/VehicleDashboard');
                } else if (UserRole === "Partner") {
                    navigate('/PartnerVehicleDashboard');
                }
            } else {
                toast.error(deleteVehicleId?.message || "Failed to delete vehicle.");
            }
        } catch (error) {
            console.error("Error Deleting vehicle data:", error);
        }
    };

    const handleAccept = async (e) => {
        e.preventDefault();

        try {
            const updatedVehicleData = await UpdateRequestStatus({
                vehicleID: vehicleId,
                requestID: requestId,
                status: "approve"
            });
            navigate(`/PartnerVehicleUpdateRequest`);

        } catch (error) {
            console.error("Error updating vehicle data:", error);
            // Optionally, log the error for more detail
            console.error("Error details:", error?.response?.data || error);
        }
    };
    const handleUpdateRequest = async (e) => {
        e.preventDefault();
        try {

            const formdata = {
                requestId: requestId,
                vehicleId: vehicleId,
                requestedBy: profileData.userId,
                requestMessage: requestMessage,
                status: "pending",
                requestType: "Update",
            };

            const UpdateRequest = await vehicleUpdateRequest(formdata);

            if (UpdateRequest && UpdateRequest.success) {
                navigate('/VehicleDashboard');
            } else {
                toast.error(UpdateRequest?.message || "Failed to send update vehicle data request.");
            }


            setIsModalOpen(false);
        } catch (error) {
            // Log the error in case of failure
            console.error("Error updating vehicle data:", error);
        }
    };
    useEffect(() => {
        if (isUpdateDone && requestId) {
            const updateRequestStatus = async () => {
                const updateStatus = await UpdateRequestStatus({
                    vehicleID: vehicleId,
                    requestID: requestId,
                    status: "review"
                });
            };

            updateRequestStatus();
        }

    }, [isUpdateDone, requestId, vehicleId, requestData]);


    const handleLocationSelect = async (lat, lng) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
            );
            const data = await response.json();
            const address = data.address || {};
            // Extract required details
            const country = address.country || "N/A";
            const state = address.state || address.region || "N/A";
            const city = address.city || address.state_district || address.town || address.village || address.county || "N/A";
            const pincode = address.postcode || address["ISO3166-2-lvl4"] || "N/A"; // Alternative for postal code


            console.log("Selected Location:", { lat, lng, state, country, city });
            console.log(data)
            // Store values
            setValue("latitude", lat);
            setValue("longitude", lng);
            setValue("state", state);
            setValue("country", country);
            setValue("city", city);
            setValue("pincode", pincode);

            setIsMapOpen(false);
        } catch (error) {
            console.error("Error fetching location details:", error);
        }
    };
    return (
        <div className="overflow-x-hidden">
            <form onSubmit={(e) => handleSubmit(onSubmit)(e)}>
                {/* Hidden vehicleId field */}
                <input type="hidden" {...register('vehicleId')} />

                <div className="grid lg:grid-cols-5 gap-6 px-6 pt-4 pb-1">
                    <div className="bg-white shadow-md rounded-lg p-6 lg:col-span-2 h-[auto]">
                        {/* Vehicle Image Slider */}
                        <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto">
                            <div className="relative grid row-span-2">
                                <div className="w-full h-auto overflow-hidden">
                                    <div className='relative w-full max-w-full  overflow-hidden'>
                                        {/* Vehicle Image Slider */}
                                        <VehicleImageSlider selectedImgs={watch("selectedImgs")} />
                                    </div>
                                    {/* Upload Image Button */}
                                    <label
                                        htmlFor="vehicle-image-upload"
                                        className="absolute bottom-0 right-0 bg-black hover:bg-blue-500 p-2 rounded-full cursor-pointer transition-all duration-200"
                                    >
                                        <Camera className="w-6 h-6 text-white" />
                                        <input
                                            type="button"
                                            id="vehicle-image-upload"
                                            className="hidden"
                                            accept="image/*"
                                            onClick={() => setIsVehiclePicOpen(true)} // Open Modal on click
                                            disabled={profileData.email !== watch("email")}
                                        />
                                    </label>
                                    <p className="text-sm text-black text-center mt-2">Upload vehicle image</p>
                                </div>

                            </div>
                        </div>

                        {/* Modal for uploading images */}
                        {isVehiclePicOpen && (
                            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                <div className="scrollbar-hide relative bg-white p-6 rounded-lg w-10/12 sm:w-80 lg:w-1/3 max-h-[70vh] overflow-auto">
                                    <h2 className="text-xl font-semibold mb-4 text-center">Upload Vehicle Pics</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {['Front View', 'Back View', 'Side View 1', 'Side View 2'].map((view, index) => (
                                            <div className="relative" key={index}>
                                                <img
                                                    src={watch(`selectedImgs[${index}]`) || '/avatar.png'}
                                                    alt={view}
                                                    className="w-full h-auto object-cover border-4 border-black shadow-lg rounded-lg transition-all duration-500"
                                                />
                                                <label
                                                    htmlFor={`vehicle-Pic-Modal-Open-${index}`}
                                                    className="absolute bottom-0 right-0 bg-black hover:bg-blue-500 p-2 rounded-full cursor-pointer transition-all duration-200"
                                                >
                                                    <Camera className="w-7 h-7 text-white" />
                                                    <Controller
                                                        name={`selectedImgs.${index}`}
                                                        control={control}
                                                        rules={{ required: 'Image is required' }}
                                                        render={({ field }) => (
                                                            <input
                                                                type="file"
                                                                id={`vehicle-Pic-Modal-Open-${index}`}
                                                                className="hidden"
                                                                accept="image/*"
                                                                onChange={(e) => {
                                                                    handleImageChange(e, index);
                                                                    field.onChange(e.target.files[0]);
                                                                }}
                                                                onBlur={field.onBlur}
                                                            />
                                                        )}
                                                    />
                                                </label>
                                                <p className="text-sm text-black text-center mt-2">{`Upload ${view}`}</p>
                                                {errors.selectedImgs && errors.selectedImgs[index] && (
                                                    <p className="text-red-500 text-xs text-center">
                                                        {errors.selectedImgs[index].message}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsVehiclePicOpen(false)}
                                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300 col-span-2"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Read-only vehicle details */}
                        <div className="space-y-6 mt-6">
                            {/* Vehicle Type */}
                            <div className="space-y-1.5">
                                <div className="text-sm text-black flex items-center gap-2">Vehicle Type</div>
                                <Controller
                                    name="vehicleType"
                                    control={control}
                                    defaultValue={watch("vehicleType") || ''}
                                    render={({ field }) => (
                                        <input
                                            type="text"
                                            {...field}
                                            placeholder="Vehicle Type"
                                            readOnly
                                            disabled
                                            className="px-4 py-2.5 bg-white rounded-lg border border-gray-600 text-black w-full"
                                        />
                                    )}
                                />
                            </div>
                            {/* Vehicle Make */}
                            <div className="space-y-1.5">
                                <div className="text-sm text-black flex items-center gap-2">Vehicle Make</div>
                                <Controller
                                    name="vehicleMake"
                                    control={control}
                                    defaultValue={watch("vehicleMake") || ''}
                                    render={({ field }) => (
                                        <input
                                            type="text"
                                            {...field}
                                            placeholder="Vehicle Make"
                                            readOnly
                                            disabled
                                            className="px-4 py-2.5 bg-white rounded-lg border border-gray-600 text-black w-full"
                                        />
                                    )}
                                />
                            </div>
                            {/* VehicleModel */}
                            <div className="space-y-1.5">
                                <div className="text-sm text-black flex items-center gap-2">Vehicle Model</div>
                                <Controller
                                    name="vehicleModel"
                                    control={control}
                                    defaultValue={watch("vehicleModel") || ''}
                                    render={({ field }) => (
                                        <input
                                            type="text"
                                            {...field}
                                            placeholder="Vehicle Model"
                                            readOnly
                                            disabled
                                            className="px-4 py-2.5 bg-white rounded-lg border border-gray-600 text-black w-full"
                                        />
                                    )}
                                />
                            </div>

                            {/* Vehicle Seat */}
                            <div className="space-y-1.5">
                                <div className="text-sm text-black flex items-center gap-2">
                                    Number of Seats
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    <Controller
                                        name="vehicleSeat"
                                        control={control}
                                        render={({ field }) => (
                                            <>
                                                {['2', '4', '5', '6', '8'].map((seat) => (
                                                    <label key={seat} className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            value={seat}
                                                            checked={field.value === seat}
                                                            onChange={() => field.onChange(seat)}
                                                            className="text-black"
                                                            disabled={profileData.email !== watch("email")}
                                                        />
                                                        <span className="text-sm">{seat}-seater</span>
                                                    </label>
                                                ))}
                                            </>
                                        )}
                                    />
                                </div>
                                {errors.seats && <p className="text-red-500 text-xs">{errors.seats.message}</p>}
                            </div>
                        </div>
                    </div>
                    <div className='bg-white shadow-md rounded-lg p-6 lg:col-span-3 h-[auto]'>
                        <div className='space-y-6'>

                            {/* Transmission Type */}
                            <div className="space-y-1.5">
                                <div className="text-sm text-black flex items-center gap-2">
                                    Transmission Type
                                </div>
                                <div className="flex items-center gap-6">
                                    <Controller
                                        name="vehicleTransmission"
                                        control={control}
                                        render={({ field }) => (
                                            <>
                                                {['manual', 'automatic'].map((type) => (
                                                    <label key={type} className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            value={type}
                                                            checked={field.value === type}
                                                            onChange={() => field.onChange(type)}
                                                            disabled={profileData.email !== watch("email")}
                                                            className="text-black"
                                                        />
                                                        <span className="text-sm">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                                                    </label>
                                                ))}
                                            </>
                                        )}
                                    />
                                </div>
                                {errors.transmission && <p className="text-red-500 text-xs">{errors.transmission.message}</p>}
                            </div>

                            {/* Fuel Type */}
                            <div className="space-y-1.5">
                                <div className="text-sm text-black flex items-center gap-2">
                                    Fuel Type
                                </div>
                                <div className="flex items-center gap-6">
                                    <Controller
                                        name="vehicleFuelType"
                                        control={control}
                                        render={({ field }) => (
                                            <>
                                                {['petrol', 'diesel', 'electric'].map((fuel) => (
                                                    <label key={fuel} className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            value={fuel}
                                                            checked={field.value === fuel}
                                                            onChange={() => field.onChange(fuel)}
                                                            disabled={profileData.email !== watch("email")}
                                                            className="text-black"
                                                        />
                                                        <span className="text-sm">{fuel.charAt(0).toUpperCase() + fuel.slice(1)}</span>
                                                    </label>
                                                ))}
                                            </>
                                        )}
                                    />
                                </div>
                                {errors.fuelType && <p className="text-red-500 text-xs">{errors.fuelType.message}</p>}
                            </div>
                            <div className="grid lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1 gap-6">
                                {/* Vehicle Reg Number */}
                                <div className="space-y-1.5">
                                    <div className="text-sm text-black flex items-center gap-2">
                                        Vehicle Reg Number
                                    </div>
                                    <Controller
                                        name="vehicleRegNumber"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                type="text"
                                                {...field}
                                                placeholder="Enter Vehicle Reg Number"
                                                disabled
                                                readOnly
                                                //  disabled={profileData.email !== watch("email")}
                                                className="px-4 py-2.5 bg-white rounded-lg border border-gray-600 text-black w-full"
                                            />
                                        )}
                                    />
                                    {errors.regNumber && <p className="text-red-500 text-xs">{errors.regNumber.message}</p>}
                                </div>

                                {/* Manufacturing Year */}
                                <div className="space-y-1.5">
                                    <div className="text-sm text-black flex items-center gap-2">
                                        Manufacturing Year
                                    </div>
                                    <Controller
                                        name="manufacturingYear"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                type="number"
                                                {...field}
                                                placeholder="Enter Manufacturing Year"
                                                disabled={profileData.email !== watch("email")}
                                                className="px-4 py-2.5 bg-white rounded-lg border border-gray-600 text-black w-full"
                                            />
                                        )}
                                    />
                                    {errors.manufacturingYear && <p className="text-red-500 text-xs">{errors.manufacturingYear.message}</p>}
                                </div>
                            </div>
                            <div className="grid lg:grid-cols-3 md:grid-cols-3 sm:grid-cols-1 gap-6">
                                {/* Price Per Day */}
                                <div className="space-y-1.5">
                                    <div className="text-sm text-black flex items-center gap-2">
                                        Price Per Day
                                    </div>
                                    <Controller
                                        name="pricePerDay"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                type="number"
                                                {...field}
                                                placeholder="Enter Price Per Day"
                                                disabled={profileData.email !== watch("email")}
                                                className="px-4 py-2.5 bg-white rounded-lg border border-gray-600 text-black w-full"
                                            />
                                        )}
                                    />
                                    {errors.pricePerDay && <p className="text-red-500 text-xs">{errors.pricePerDay.message}</p>}
                                </div>

                                {/* Price Per Hour */}
                                <div className="space-y-1.5">
                                    <div className="text-sm text-black flex items-center gap-2">
                                        Price Per Hour
                                    </div>
                                    <Controller
                                        name="pricePerHour"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                type="number"
                                                {...field}
                                                placeholder="Enter Price Per Hour"
                                                disabled={profileData.email !== watch("email")}
                                                className="px-4 py-2.5 bg-white rounded-lg border border-gray-600 text-black w-full"
                                            />
                                        )}
                                    />
                                    {errors.pricePerHour && <p className="text-red-500 text-xs">{errors.pricePerHour.message}</p>}
                                </div>

                                {/* Availability Status Toggle */}
                                <div className="space-y-1.5">
                                    <div>
                                        <label>Availability</label>

                                        <Controller
                                            name="availabilityStatus"
                                            control={control}
                                            render={({ field }) => (
                                                <div
                                                    className={`w-14 h-7 flex items-center ${field.value === "Available" ? "bg-green-500" : "bg-gray-400"
                                                        } 
                        rounded-full p-1 cursor-pointer transition-all duration-300 
                        ${profileData.email !== watch("email") || !isPendingRequest || isBooked ? "opacity-50 cursor-not-allowed" : ""}`}
                                                    onClick={profileData.email === watch("email") && !isPendingRequest ? handleToggleAvailability : undefined}
                                                >
                                                    <div
                                                        className={`bg-white w-5 h-5 rounded-full shadow-md transform ${field.value === "Available" ? "translate-x-7" : "translate-x-0"
                                                            } transition-all duration-300`}
                                                    ></div>
                                                </div>
                                            )}
                                        />
                                        <p>Status: <strong>{watch("availabilityStatus")}</strong></p>
                                    </div>
                                </div>

                            </div>

                            {/* Vehicle Address */}
                            <div className="space-y-1.5">
                                <div className="text-sm text-black flex items-center gap-2">
                                    Vehicle Address
                                </div>
                                <Controller
                                    name="vehicleAddress"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    {...field}
                                                    type="text"
                                                    placeholder="Enter Vehicle Address"
                                                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                                    className="px-4 py-2.5 bg-white rounded-lg border border-gray-600 text-black w-full placeholder-black"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setIsMapOpen(true)}
                                                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                >
                                                    <MapPin className="w-5 h-5" />
                                                </button>
                                            </div>
                                            {fieldState?.error && (
                                                <p className="text-red-500 text-xs">{fieldState.error.message}</p>
                                            )}
                                        </>
                                    )}
                                />
                            </div>
                            <div className="grid lg:grid-cols-3 md:grid-cols-3 sm:grid-cols-1 gap-6">

                                {/* City */}
                                <div className="space-y-1.5">
                                    <div className="text-sm text-black flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-black" />
                                        City
                                    </div>
                                    <Controller
                                        name="city"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <input
                                                    {...field}
                                                    type="text"
                                                    placeholder="City"
                                                    className="px-4 py-2.5 bg-white rounded-lg border border-gray-600 text-black w-full placeholder-black"
                                                />
                                                {fieldState?.error && (
                                                    <p className="text-red-500 text-xs">{fieldState.error.message}</p>
                                                )}
                                            </>
                                        )}
                                    />
                                </div>

                                {/* State */}
                                <div className="space-y-1.5">
                                    <div className="text-sm text-gray-600 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-gray-500" />
                                        State
                                    </div>
                                    <Controller
                                        name="state"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <input
                                                    {...field}
                                                    type="text"
                                                    placeholder="State"
                                                    className="px-4 py-2.5 bg-gray-200 rounded-lg border border-gray-400 text-gray-500 w-full placeholder-gray-500 opacity-70 cursor-not-allowed"
                                                    readOnly
                                                    disabled
                                                />
                                                {fieldState?.error && (
                                                    <p className="text-red-500 text-xs">{fieldState.error.message}</p>
                                                )}
                                            </>
                                        )}
                                    />
                                </div>

                                {/* Country */}
                                <div className="space-y-1.5">
                                    <div className="text-sm text-gray-600 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-gray-500" />
                                        Country
                                    </div>
                                    <Controller
                                        name="country"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <input
                                                    {...field}
                                                    type="text"
                                                    placeholder="Country"
                                                    className="px-4 py-2.5 bg-gray-200 rounded-lg border border-gray-400 text-gray-500 w-full placeholder-gray-500 opacity-70 cursor-not-allowed"
                                                    readOnly
                                                    disabled
                                                />
                                                {fieldState?.error && (
                                                    <p className="text-red-500 text-xs">{fieldState.error.message}</p>
                                                )}
                                            </>
                                        )}
                                    />
                                </div>

                            </div>

                            <div className="grid lg:grid-cols-3 md:grid-cols-3 sm:grid-cols-1 gap-6">

                                {/* Pincode */}
                                <div className="space-y-1.5">
                                    <div className="text-sm text-black flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-black" />
                                        Pincode
                                    </div>
                                    <Controller
                                        name="pincode"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <input
                                                    {...field}
                                                    type="text"
                                                    placeholder="Pincode"
                                                    className="px-4 py-2.5 bg-white rounded-lg border border-gray-600 text-black w-full placeholder-black"
                                                />
                                                {fieldState?.error && (
                                                    <p className="text-red-500 text-xs">{fieldState.error.message}</p>
                                                )}
                                            </>
                                        )}
                                    />
                                </div>

                                {/* Latitude */}
                                <div className="space-y-1.5">
                                    <div className="text-sm text-gray-600 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-gray-500" />
                                        Latitude
                                    </div>
                                    <Controller
                                        name="latitude"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <input
                                                    {...field}
                                                    type="number"
                                                    placeholder="Latitude"
                                                    className="px-4 py-2.5 bg-gray-200 rounded-lg border border-gray-400 text-gray-500 w-full placeholder-gray-500 opacity-70 cursor-not-allowed"
                                                    readOnly
                                                    disabled
                                                />
                                                {fieldState?.error && (
                                                    <p className="text-red-500 text-xs">{fieldState.error.message}</p>
                                                )}
                                            </>
                                        )}
                                    />
                                </div>

                                {/* Longitude */}
                                <div className="space-y-1.5">
                                    <div className="text-sm text-gray-600 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-gray-500" />
                                        Longitude
                                    </div>
                                    <Controller
                                        name="longitude"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <input
                                                    {...field}
                                                    type="number"
                                                    placeholder="Longitude"
                                                    className="px-4 py-2.5 bg-gray-200 rounded-lg border border-gray-400 text-gray-500 w-full placeholder-gray-500 opacity-70 cursor-not-allowed"
                                                    readOnly
                                                    disabled
                                                />
                                                {fieldState?.error && (
                                                    <p className="text-red-500 text-xs">{fieldState.error.message}</p>
                                                )}
                                            </>
                                        )}
                                    />
                                </div>

                            </div>

                            {/* Map */}
                            <div>
                                {isMapOpen && (
                                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                        <div className="relative bg-white p-6 rounded-lg w-11/12 sm:w-96 md:w-3/4 lg:w-1/2 xl:w-1/3 max-h-[90vh] overflow-auto scrollbar-hide mx-4 sm:mx-8">
                                            <h2 className="text-xl font-semibold mb-4 text-center">Select Map Location</h2>

                                            <MapSelector onLocationChange={handleLocationSelect} initialCoordinates={{ lat: latitude, lng: longitude }} onClose={() => setIsMapOpen(false)} />
                                            <div className="coordinates-info">
                                                <strong >Selected Location:</strong>
                                                <br />
                                                <span> Latitude: {latitude}, </span>
                                                <span> Longitude: {longitude}</span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                                {/* Cancel Request Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => setIsMapOpen(false)}
                                                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300 col-span-2"
                                                >
                                                    Close
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>


                            <div className="grid grid-cols-2 gap-6">
                                {/* Owner Role */}
                                <div className="space-y-1.5">
                                    <div className="text-sm text-black flex items-center gap-2">Owner Role</div>
                                    <Controller
                                        name="roleName"
                                        control={control}
                                        defaultValue={watch("roleName")}
                                        render={({ field }) => (
                                            <input
                                                type="text"
                                                {...field}
                                                readOnly
                                                disabled
                                                className="px-4 py-2.5 bg-white rounded-lg border border-gray-600 text-black w-full"
                                            />
                                        )}
                                    />
                                </div>

                                {/* Vehicle Owner Email */}
                                <div className="space-y-1.5">
                                    <div className="text-sm text-black flex items-center gap-2">Vehicle Owner</div>
                                    <Controller
                                        name="email"
                                        control={control}
                                        defaultValue={watch("email")}
                                        render={({ field }) => (
                                            <input
                                                type="email"
                                                {...field}
                                                readOnly
                                                disabled
                                                className="px-4 py-2.5 bg-white rounded-lg border border-gray-600 text-black w-full"
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {/* Update Button */}
                                <div>
                                    {watch("email") === profileData.email ? (
                                        isUpdatingVehicle ? (
                                            <div className="flex items-center justify-center">
                                                <Loader className="size-10 animate-spin" />
                                            </div>
                                        ) : (
                                            <button
                                                type="submit" // Now part of the form submission
                                                onClick={(e) => handleUpdate(watch(), e)}
                                                className="w-full px-4 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition duration-300"
                                            >
                                                Update
                                            </button>
                                        )
                                    ) : UserRole === "Admin" && requestStatus === "review" ? (
                                        isUpdating ? (
                                            <div className="flex items-center justify-center">
                                                <Loader className="size-10 animate-spin" />
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={(e) => handleAccept(e)}
                                                className="w-full px-4 py-2.5 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition duration-300"
                                            >
                                                Accept

                                            </button>
                                        )
                                    ) : (
                                        isRequesting ? (
                                            <div className="flex items-center justify-center">
                                                <Loader className="size-10 animate-spin" />
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setIsModalOpen(true)}
                                                className="w-full px-4 py-2.5 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition duration-300"
                                            >
                                                {UserRole === "Admin" && requestId && requestStatus === "pending"
                                                    ? "Update Request"
                                                    : "Request Update"}
                                            </button>
                                        )
                                    )}
                                </div>
                                

                                {/* Delete Button */}
                                <div>
                                    {UserRole === "Admin" && requestStatus === "review" ? (
                                        isRequesting ? (
                                            <div className="flex items-center justify-center">
                                                <Loader className="size-10 animate-spin" />
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setIsModalOpen(true)}
                                                className="w-full px-4 py-2.5 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition duration-300"
                                            >
                                                Reject
                                            </button>
                                        )
                                    ) : isDeletingVehicle ? (
                                        <div className="flex items-center justify-center">
                                            <Loader className="size-10 animate-spin" />
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={(e) => handleDelete(e)} // Pass form data
                                            className="w-full px-4 py-2.5 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition duration-300"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div>
                                {/* Modal */}
                                {isModalOpen && (
                                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                        <div className="relative bg-white p-6 rounded-lg w-11/12 sm:w-96">
                                            <h2 className="text-xl font-semibold mb-4">Update Request Form</h2>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700">Request Message</label>
                                                <textarea
                                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                                    value={requestMessage}
                                                    onChange={(e) => setRequestMessage(e.target.value)}
                                                    rows={4}
                                                    placeholder="Enter your request message"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {/* Cancel Request Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => setIsModalOpen(false)}
                                                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300"
                                                >
                                                    Cancel Request
                                                </button>

                                                {/* Submit Request Button */}
                                                {isRequesting ? (
                                                    <div className="flex items-center justify-center">
                                                        <Loader className="size-10 animate-spin" />
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleUpdateRequest(e)}
                                                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300"
                                                    >
                                                        {UserRole === "Admin" && requestId && requestStatus === "pending"
                                                            ? "Submit Request"
                                                            : "Resend Request"}
                                                    </button>
                                                )}
                                            </div>

                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </form >
        </div >
    );
}

