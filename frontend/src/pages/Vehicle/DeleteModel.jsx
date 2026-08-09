import React, { useEffect, useState } from 'react';
import AdminNav from '../../component/AdminNav/AdminNav';
import { AdminSideBar } from '../../component/AdminSideBar/AdminSideBar';
import { Loader, Camera } from 'lucide-react';
import { useVehicleStore } from '../../store/useVehicleStore';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function DeleteModel() {
    const { isDrawerOpen } = true; // Simplified drawer state
    const {
        vehicleModelDetails,
        deleteVehicleModel,
        updateVehicleModel,
        isDeletingModel,
        isUpdatingModel,
    } = useVehicleStore();

    const { ModelId } = useParams();
    const navigate = useNavigate();

    // State to hold vehicle model details
    const [vehicleData, setVehicleData] = useState({
        modelID: '',
        vehicleType: '',
        vehicleMake: '',
        vehicleModel: '',
        modelPic: '',
    });

    useEffect(() => {
        if (!ModelId || !vehicleModelDetails || vehicleModelDetails.length === 0) return;

        // Find the model by ModelId
        const model = vehicleModelDetails.find((item) => item._id === ModelId);
        if (model) {
            setVehicleData({
                modelID: model._id,
                vehicleType: model.vehicleType || '',
                vehicleMake: model.vehicleMake || '',
                vehicleModel: model.vehicleModel || '',
                modelPic: model.modelPic || '',
            });
        } else {
            toast.error('Vehicle model not found.');
        }
    }, [ModelId, vehicleModelDetails]);

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size is too large. Max 5MB.');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setVehicleData((prev) => ({
                    ...prev,
                    modelPic: reader.result,
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDelete = async () => {

        try {
            const response = await deleteVehicleModel(vehicleData);
            if (response?.success) {
                toast.success('Vehicle model deleted successfully.');
                navigate('/ManageModel');
            } else {
                toast.error(response?.message || 'Unable to delete vehicle model.');
            }
        } catch (error) {
            toast.error('An error occurred while deleting the vehicle model.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await updateVehicleModel(vehicleData);
            if (response?.success) {
                toast.success('Vehicle model Picture updated successfully.');
                navigate('/ManageModel');
            } else {
                toast.error(response?.message || 'Failed to update vehicle model Picture.');
            }
        } catch (error) {
            toast.error('An error occurred while updating the vehicle model Picture.');
        }
    };

    return (
        <div className="overflow-x-hidden">
            <AdminNav />
            <AdminSideBar />
            <div className={`transition-all duration-300 ${isDrawerOpen ? 'lg:pl-[16rem]' : ''} max-w-[full] lg:max-w-xl lg:max-h-[full] mx-auto mt-16`}>
                <form onSubmit={handleSubmit}>
                    <div className="grid lg:grid-cols-1 md:grid-cols-1 gap-6 px-6 pt-4 pb-1">
                        {/* Vehicle Model Information */}
                        <div className="bg-white shadow-md rounded-lg p-6 grid grid-rows-4 gap-6">
                            <input type="hidden" value={vehicleData.modelID} />
                            <div className="relative grid row-span-2">
                                <img
                                    src={vehicleData.modelPic || '/avatar.png'}
                                    alt="Vehicle Model"
                                    className="w-full h-64 object-cover border-4 border-black shadow-lg rounded-lg"
                                />
                                <label
                                    htmlFor="vehicle-image-upload"
                                    className="absolute bottom-0 right-0 bg-black hover:bg-blue-500 p-2 rounded-full cursor-pointer"
                                >
                                    <Camera className="w-6 h-6 text-white" />
                                    <input
                                        type="file"
                                        id="vehicle-image-upload"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </label>
                                <p className="text-sm text-black text-center mt-2">Upload Model image</p>
                            </div>
                            <div className="space-y-6 row-span-2">
                                {['vehicleType', 'vehicleMake', 'vehicleModel'].map((field) => (
                                    <div key={field} className="space-y-1.5">
                                        <label className="text-sm text-black flex items-center gap-2 capitalize">
                                            {field.replace(/([A-Z])/g, ' $1')}
                                        </label>
                                        <input
                                            type="text"
                                            name={field}
                                            value={vehicleData[field]}
                                            readOnly
                                            disabled
                                            className="px-4 py-2.5 bg-white rounded-lg border border-gray-600 text-black w-full"
                                        />
                                    </div>
                                ))}
                            </div>
                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="submit"
                                    disabled={isUpdatingModel}
                                    className={`w-full px-4 py-2.5 font-semibold rounded-lg transition ${isUpdatingModel ? 'bg-white text-blue-500' : 'bg-blue-500 text-white'} hover:bg-blue-600`}
                                >
                                    {isUpdatingModel ? (
                                        <div className="flex items-center justify-center">
                                            <Loader className="animate-spin " />
                                        </div>
                                    ) : (
                                        'Update'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    disabled={isDeletingModel}
                                    onClick={handleDelete}
                                    className={`w-full px-4 py-2.5 font-semibold rounded-lg transition ${isDeletingModel ? 'bg-white text-red-500' : 'bg-red-500 text-white'} hover:bg-red-600`}
                                >
                                    {isDeletingModel ? (
                                        <div className="flex items-center justify-center">
                                            <Loader className="animate-spin" />
                                        </div>
                                    ) : (
                                        'Delete'
                                    )}
                                </button>
                            </div>

                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
