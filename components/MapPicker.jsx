'use client';

import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker for current location
const currentLocationIcon = L.divIcon({
  html: `
    <div style="
      width: 20px;
      height: 20px;
      background: #4ade80;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [20, 20],
  className: 'current-location-marker'
});

// Map click handler component
function LocationSelector({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
    },
  });
  return null;
}

export default function MapPicker({ 
  center, 
  currentLocation, 
  selectedLocation, 
  onLocationSelect 
}) {
  return (
    <MapContainer
      center={center}
      zoom={16}
      style={{ height: '300px', width: '100%', borderRadius: '12px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <LocationSelector onLocationSelect={onLocationSelect} />
      
      {/* Current location marker (green dot) */}
      {currentLocation && (
        <Marker 
          position={[currentLocation.lat, currentLocation.lng]}
          icon={currentLocationIcon}
        />
      )}
      
      {/* Selected location marker (red pin) */}
      {selectedLocation && (
        <Marker position={[selectedLocation.lat, selectedLocation.lng]} />
      )}
    </MapContainer>
  );
}