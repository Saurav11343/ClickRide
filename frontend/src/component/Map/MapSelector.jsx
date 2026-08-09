import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MapSelector = ({
    onLocationChange,
    initialCoordinates = { lat: 23.14440114242026, lng: 78.68046992355694 },
    disableMapMove = false
}) => {
    const [position, setPosition] = useState(initialCoordinates);
    const mapRef = useRef(null); // Reference to map instance

    // Custom Marker Icon
    const customIcon = new L.Icon({
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [0, -41],
    });

    // Component to place a marker where the user clicks
    const LocationMarker = () => {
        useMapEvents({
            click(event) {
                if (!disableMapMove) {
                    const { lat, lng } = event.latlng;
                    setPosition({ lat, lng });
                    onLocationChange(lat, lng);
                }
            },
        });

        return position ? (
            <Marker position={position} icon={customIcon}>
                <Popup>
                    <span>Selected Location: {position.lat}, {position.lng}</span>
                </Popup>
            </Marker>
        ) : null;
    };

    // Ensure position updates when initialCoordinates change
    useEffect(() => {
        setPosition(initialCoordinates);

        // Move map to new position when initialCoordinates change
        if (mapRef.current) {
            mapRef.current.setView([initialCoordinates.lat, initialCoordinates.lng], 12); // Adjust zoom level as needed
        }
    }, [initialCoordinates.lat, initialCoordinates.lng]);

    return (
        <div className="map-wrapper z-0 relative border-2 border-gray-300 rounded-lg shadow-lg overflow-hidden">
            <MapContainer
                center={position}
                zoom={12} // Default zoom level
                style={{ height: "500px", width: "100%" }}
                dragging={!disableMapMove}
                touchZoom={!disableMapMove}
                scrollWheelZoom={!disableMapMove}
                doubleClickZoom={!disableMapMove}
                boxZoom={!disableMapMove}
                keyboard={!disableMapMove}
                zoomControl={!disableMapMove}
                whenCreated={(map) => (mapRef.current = map)} // Store map instance
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
                />
                <LocationMarker />
            </MapContainer>

        </div>

    );
};

export default MapSelector;
