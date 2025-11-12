import React, { useState, useEffect, useMemo } from 'react';
import AdminNav from '../../component/AdminNav/AdminNav';
import { AdminSideBar } from '../../component/AdminSideBar/AdminSideBar';
import { useVehicleStore } from '../../store/useVehicleStore';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Clock, Car, AlertCircle, Gauge, Fuel, Users } from 'lucide-react';

export default function VehicleDashboard() {
    const navigate = useNavigate();
    const { vehicleDetails, fetchVehicleData } = useVehicleStore();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        availabilityStatus: 'all',
        vehicleType: 'all',
        make: 'all',
        model: 'all'
    });

    // Validate and normalize vehicle data
    const normalizedVehicles = useMemo(() => {
        return Array.isArray(vehicleDetails) ? vehicleDetails : [];
    }, [vehicleDetails]);

    // Fetch vehicles data
    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                await fetchVehicleData();
            } catch (err) {
                setError('Failed to load vehicles. Please try again later.');
                console.error('Fetch error:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [fetchVehicleData]);

    // Get unique values from data
    const uniqueMakes = useMemo(() => {
        const makes = new Set(normalizedVehicles.map(v => v.modelID?.vehicleMake));
        return Array.from(makes).filter(Boolean).sort();
    }, [normalizedVehicles]);

    const uniqueModels = useMemo(() => {
        const models = new Set(normalizedVehicles.map(v => v.modelID?.vehicleModel));
        return Array.from(models).filter(Boolean).sort();
    }, [normalizedVehicles]);

    const uniqueTypes = useMemo(() => {
        const types = new Set(normalizedVehicles.map(v => v.modelID?.vehicleType));
        return Array.from(types).filter(Boolean).sort();
    }, [normalizedVehicles]);

    // Filter and search logic
    const filteredVehicles = useMemo(() => {
        return normalizedVehicles.filter(vehicle => {
            const matchesSearch = vehicle.vehicleRegNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                vehicle.modelID?.vehicleMake?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                vehicle.modelID?.vehicleModel?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = filters.availabilityStatus === 'all' ||
                vehicle.availabilityStatus?.toLowerCase() === filters.availabilityStatus.toLowerCase();

            const matchesType = filters.vehicleType === 'all' ||
                vehicle.modelID?.vehicleType?.toLowerCase() === filters.vehicleType.toLowerCase();

            const matchesMake = filters.make === 'all' ||
                vehicle.modelID?.vehicleMake?.toLowerCase() === filters.make.toLowerCase();

            const matchesModel = filters.model === 'all' ||
                vehicle.modelID?.vehicleModel?.toLowerCase() === filters.model.toLowerCase();

            return matchesSearch && matchesStatus && matchesType && matchesMake && matchesModel;
        });
    }, [normalizedVehicles, searchTerm, filters]);

    // Recent vehicles (last 10 added)
    const recentVehicles = useMemo(() => {
        return [...normalizedVehicles]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);
    }, [normalizedVehicles]);

    const handleViewVehicleDetails = (vehicleId) => {
        navigate(`/VehicleManage/${vehicleId}`);
    };

    const statusColors = {
        available: 'bg-green-100 text-green-800',
        booked: 'bg-purple-100 text-purple-800',
        unavailable: 'bg-red-100 text-red-800',
        maintenance: 'bg-yellow-100 text-yellow-800'
    };

    const EmptyState = ({ message }) => (
        <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700">{message}</h3>
            <p className="text-sm text-gray-500 mt-1">No vehicles match your criteria</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminNav />
            <AdminSideBar />

            <main className="pt-16 lg:pl-[16rem] transition-all duration-300">
                <div className="px-4 py-6 sm:px-6 lg:px-8">
                    {/* Search and Filter Section */}
                    <div className="mb-8 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search vehicles by registration, make, or model..."
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-wrap gap-4">
                            {/* Status Filter */}
                            <div className="flex items-center gap-2">
                                <Filter className="h-5 w-5 text-gray-600" />
                                <select
                                    className="rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                    value={filters.availabilityStatus}
                                    onChange={(e) => setFilters(prev => ({ ...prev, availabilityStatus: e.target.value }))}
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="available">Available</option>
                                    <option value="booked">Booked</option>
                                    <option value="unavailable">Unavailable</option>
                                    <option value="maintenance">Maintenance</option>
                                </select>
                            </div>

                            {/* Type Filter */}
                            <div className="flex items-center gap-2">
                                <Car className="h-5 w-5 text-gray-600" />
                                <select
                                    className="rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                    value={filters.vehicleType}
                                    onChange={(e) => setFilters(prev => ({ ...prev, vehicleType: e.target.value }))}
                                >
                                    <option value="all">All Types</option>
                                    {uniqueTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Gerne Filter */}
                            <div className='flex item-center gap-2'>
                                <Car className='' />
                                <select
                                    className='rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                    value={filters.vehicleType}
                                    onChange={(e) => setFilters(prev => ({ ...prev, vehicleType: e.target.value }))}
                                >
                                    <option value="all">All Types</option>
                                    {uniqueTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}

                                </select>

                            </div>
                            {/* Genre Filter */}
                            <div className="flex items-center gap-2">
                                <Car className="h-5 w-5 text-gray-600" />
                                <select
                                    className="rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                    value={filters.vehicleType}
                                    onChange={(e) => setFilters(prev => ({ ...prev, vehicleType: e.target.value }))}
                                >
                                    <option value="all">All Types</option>
                                    {uniqueTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Make Filter */}
                            <div className="flex items-center gap-2">
                                <Car className="h-5 w-5 text-gray-600" />
                                <select
                                    className="rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                    value={filters.make}
                                    onChange={(e) => setFilters(prev => ({ ...prev, make: e.target.value }))}
                                >
                                    <option value="all">All Makes</option>
                                    {uniqueMakes.map(make => (
                                        <option key={make} value={make}>{make}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Model Filter */}
                            <div className="flex items-center gap-2">
                                <Car className="h-5 w-5 text-gray-600" />
                                <select
                                    className="rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                    value={filters.model}
                                    onChange={(e) => setFilters(prev => ({ ...prev, model: e.target.value }))}
                                >
                                    <option value="all">All Models</option>
                                    {uniqueModels.map(model => (
                                        <option key={model} value={model}>{model}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

<div>
    <select name="" id="">
    </select>
</div>

                    {/* Main Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Vehicle List */}
                        <div className="lg:col-span-2 max-h-[540px] overflow-y-auto">
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="sticky top-0 z-10 border-b border-gray-200 p-4 bg-gray-50 shadow-sm">
                                    <h2 className="text-xl font-semibold text-gray-800">
                                        Vehicles ({filteredVehicles.length})
                                    </h2>
                                </div>

                                <div className="p-4 sm:p-6">
                                    {isLoading ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {[...Array(6)].map((_, i) => (
                                                <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-80" />
                                            ))}
                                        </div>
                                    ) : error ? (
                                        <div className="text-center py-8 text-red-600">
                                            {error}
                                        </div>
                                    ) : filteredVehicles.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {filteredVehicles.map((vehicle) => (
                                                <div
                                                    key={vehicle._id}
                                                    onClick={() => handleViewVehicleDetails(vehicle._id)}
                                                    className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border border-gray-200"
                                                >
                                                    <div className="relative h-48">
                                                        <img
                                                            src={vehicle?.vehicleImagesId?.VehicleFrontPic || '/vehicle-placeholder.jpg'}
                                                            alt={vehicle.vehicleRegNumber}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                            onError={(e) => {
                                                                e.target.src = '/vehicle-placeholder.jpg';
                                                            }}
                                                        />
                                                        <div
                                                            className='absolute top-2 right-2 bg-white px-6 text-blue-600 shadow'>

                                                        </div>
                                                        <div className="absolute top-2 right-2 bg-white px-3 py-1 rounded-full text-sm font-medium text-blue-600 shadow-sm">
                                                            {vehicle.modelID?.vehicleType}
                                                        </div>
                                                        <div className="absolute bottom-2 left-2">
                                                            <span className={`px-2 py-1 text-xs rounded-full ${statusColors[vehicle.availabilityStatus?.toLowerCase()] || 'bg-gray-100 text-gray-800'}`}>
                                                                {vehicle.availabilityStatus}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="p-4">
                                                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                                            {vehicle.modelID?.vehicleMake} {vehicle.modelID?.vehicleModel}
                                                        </h3>
                                                        <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                                                            <div className="flex items-center gap-2">
                                                                <Users className="w-4 h-4" />
                                                                {vehicle.vehicleSeat} Seats
                                                            </div>
                                                            <div className='flex items-center gap-2'>
                                                                <Users className='w-4 h-4' />
                                                                {vehicle.vehicleSeat}Dummy Seats
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Gauge className="w-4 h-4" />
                                                                {vehicle.vehicleTransmission}
                                                            </div>
                                                            <div className='flex items-center gap-2'>
                                                                <Users className='w-4 h-4' />
                                                                {vehicle.vehicleTransmission}Dummy Transmission
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Fuel className="w-4 h-4" />
                                                                {vehicle.vehicleFuelType}
                                                            </div>
                                                            <div className='flex items-center gap-2'>
                                                                <Users className='w-4 h-4' />
                                                                {vehicle.vehicleFuelType}Dummy Fuel Type
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Car className="w-4 h-4" />
                                                                {vehicle.vehicleRegNumber}
                                                            </div>
                                                        </div>
                                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-gray-500">Daily Rate</span>
                                                                <span className="text-xl font-bold text-blue-600">
                                                                    ${vehicle.pricePerDay?.$numberDecimal || vehicle.pricePerDay}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <EmptyState message="No vehicles found" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recent Vehicles Sidebar */}
                        <div className="lg:col-span-1 max-h-[540px] overflow-y-auto">
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="sticky top-0 z-10 border-b border-gray-200 p-4 bg-gray-50 shadow-sm">
                                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-gray-600" />
                                        Recently Added
                                    </h2>
                                </div>

                                <div className="p-4 space-y-4">
                                    {recentVehicles.length > 0 ? (
                                        recentVehicles.map((vehicle) => (
                                            <div
                                                key={vehicle._id}
                                                onClick={() => handleViewVehicleDetails(vehicle._id)}
                                                className="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                                            >
                                                <img
                                                    src={vehicle?.vehicleImagesId?.VehicleFrontPic || '/vehicle-placeholder.jpg'}
                                                    alt={vehicle.vehicleRegNumber}
                                                    className="w-12 h-12 rounded-md object-cover border border-gray-200"
                                                />
                                                <div className="ml-3 flex-1">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {vehicle.modelID?.vehicleMake} {vehicle.modelID?.vehicleModel}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        Added {new Date(vehicle.createdAt).toLocaleString()}
                                                    </p>
                                                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${statusColors[vehicle.availabilityStatus?.toLowerCase()] || 'bg-gray-100 text-gray-800'}`}>
                                                        {vehicle.availabilityStatus}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-4 text-gray-500 text-sm">
                                            No recent vehicles
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}