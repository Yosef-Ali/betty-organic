'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import styles from './LocationModal.module.css';

// Dynamically import map component to avoid SSR issues
const MapPicker = dynamic(() => import('./MapPicker'), {
  ssr: false,
  loading: () => <div className={styles.mapLoading}>Loading map...</div>
});

export default function LocationModal({ isOpen, onClose, onLocationSelect }) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMap, setShowMap] = useState(false);

  // Get current location
  const getCurrentLocation = () => {
    setLoading(true);
    
    if (!navigator.geolocation) {
      alert('Location not supported');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setCurrentLocation(coords);
        setSelectedLocation(coords);
        
        // Get address
        const addr = await getAddressFromCoords(coords.lat, coords.lng);
        setAddress(addr);
        setLoading(false);
        setShowMap(true);
      },
      (error) => {
        console.error('Location error:', error);
        setLoading(false);
        alert('Could not get location. Please search or pick on map.');
      }
    );
  };

  // Get address from coordinates
  const getAddressFromCoords = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.address) {
        const parts = [];
        if (data.address.road) parts.push(data.address.road);
        if (data.address.suburb) parts.push(data.address.suburb);
        if (data.address.city) parts.push(data.address.city);
        
        return parts.join(', ') || data.display_name;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    
    return `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  // Handle location selection from map
  const handleMapClick = async (coords) => {
    setSelectedLocation(coords);
    const addr = await getAddressFromCoords(coords.lat, coords.lng);
    setAddress(addr);
  };

  // Search for location
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery + ', Addis Ababa, Ethiopia'
        )}&limit=1`
      );
      const data = await response.json();
      
      if (data && data[0]) {
        const coords = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
        setSelectedLocation(coords);
        setAddress(data[0].display_name);
        setShowMap(true);
      } else {
        alert('Location not found. Try different search terms.');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again.');
    }
    setLoading(false);
  };

  // Confirm selection
  const handleConfirm = () => {
    if (selectedLocation && address) {
      onLocationSelect({
        coords: selectedLocation,
        address: address
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>📍 Delivery Location</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.content}>
          {/* Quick actions */}
          <div className={styles.quickActions}>
            <button 
              className={styles.locationBtn}
              onClick={getCurrentLocation}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  Getting location...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  Use Current Location
                </>
              )}
            </button>

            <button 
              className={styles.mapBtn}
              onClick={() => setShowMap(true)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Pick on Map
            </button>
          </div>

          {/* Search */}
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search for area, street, or landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className={styles.searchInput}
            />
            <button onClick={handleSearch} className={styles.searchBtn}>
              Search
            </button>
          </div>

          {/* Map */}
          {showMap && (
            <div className={styles.mapContainer}>
              <MapPicker
                center={selectedLocation || { lat: 9.0192, lng: 38.8325 }}
                currentLocation={currentLocation}
                selectedLocation={selectedLocation}
                onLocationSelect={handleMapClick}
              />
            </div>
          )}

          {/* Selected address */}
          {address && (
            <div className={styles.addressBox}>
              <h3>Selected Location:</h3>
              <p>{address}</p>
              <textarea
                placeholder="Add delivery instructions (optional)"
                className={styles.instructions}
                rows="2"
              />
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button 
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={!selectedLocation}
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
}