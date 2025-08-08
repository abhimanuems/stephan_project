import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      
      try {
        // Reverse geocoding to get address
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        
        const address = data.display_name || `${lat}, ${lng}`;
        
        onLocationSelect({
          latitude: lat,
          longitude: lng,
          address: address
        });
      } catch (error) {
        console.error('Error getting address:', error);
        onLocationSelect({
          latitude: lat,
          longitude: lng,
          address: `${lat}, ${lng}`
        });
      }
    },
  });

  return null;
}

const LocationMap = ({ 
  selectedLocation, 
  onLocationSelect, 
  height = "400px",
  width = "100%" 
}) => {
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default to India center

  useEffect(() => {
    // Get user's current location if available
    if (navigator.geolocation && !selectedLocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          
          // Auto-select current location if no location is selected
          try {
            // Reverse geocoding to get address
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            
            const address = data.display_name || `${latitude}, ${longitude}`;
            
            onLocationSelect({
              latitude: latitude,
              longitude: longitude,
              address: address
            });
          } catch (error) {
            console.error('Error getting address for current location:', error);
            onLocationSelect({
              latitude: latitude,
              longitude: longitude,
              address: `${latitude}, ${longitude}`
            });
          }
        },
        (error) => {
          console.log('Error getting location:', error);
        }
      );
    }
  }, [selectedLocation, onLocationSelect]);

  return (
    <div style={{ height, width, border: '1px solid #ccc', borderRadius: '8px' }}>
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapClickHandler onLocationSelect={onLocationSelect} />
        
        {selectedLocation && (
          <Marker position={[selectedLocation.latitude, selectedLocation.longitude]}>
            <Popup>
              <div>
                <strong>Selected Location</strong><br />
                Latitude: {selectedLocation.latitude.toFixed(6)}<br />
                Longitude: {selectedLocation.longitude.toFixed(6)}<br />
                Address: {selectedLocation.address}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default LocationMap;
