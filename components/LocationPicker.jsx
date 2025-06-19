'use client';

import React, { useState } from 'react';

const LocationPicker = ({ onLocationSelected }) => {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [error, setError] = useState('');

  const getLocation = () => {
    // Clear previous errors
    setError('');
    
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        setLocation({ latitude, longitude });
        
        // Get readable address from coordinates
        const readableAddress = await getAddressFromCoords(latitude, longitude);
        setAddress(readableAddress);
        setLoading(false);

        // Notify parent component
        if (onLocationSelected) {
          onLocationSelected({
            coords: { latitude, longitude },
            address: readableAddress,
          });
        }
      },
      (error) => {
        setLoading(false);
        
        let errorMessage = 'Could not get location. Please enter your address manually.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Please enter manually.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
        }
        
        setError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const getAddressFromCoords = async (lat, lng) => {
    // Using OpenStreetMap's Nominatim API (free, no API key needed)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      
      const data = await response.json();
      
      if (data && data.address) {
        const { road, suburb, city, county, state } = data.address;
        const parts = [road, suburb, city || county, state].filter(Boolean);
        return parts.join(', ') || `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    
    return `Location found (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  };

  const handleConfirm = () => {
    if (location || manualAddress.trim()) {
      if (onLocationSelected) {
        onLocationSelected({
          address: manualAddress || address,
          coords: location,
          isManual: !location
        });
      }
    }
  };

  return (
    <div className="location-picker">
      <div className="header">
        <span className="authenticated-tag">Authenticated</span>
        <button className="close-btn">✕</button>
      </div>

      <h2>Complete Your Order</h2>
      <p className="subtitle">Review your items and confirm delivery details</p>

      {/* Order Summary */}
      <div className="order-summary">
        <div className="order-item">
          <div>
            <h3>papaya</h3>
            <p>1000g (ETB 80/kg)</p>
          </div>
          <span className="price">ETB 80.00</span>
        </div>
        <div className="order-total">
          <span>Total:</span>
          <span className="price">ETB 80.00</span>
        </div>
      </div>

      {/* Location Section */}
      <div className="location-section">
        <h3>Delivery Location</h3>
        
        <button
          className={`location-button ${loading ? 'loading' : ''} ${location ? 'success' : ''}`}
          onClick={getLocation}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Getting location...
            </>
          ) : location ? (
            <>✓ Location Set</>
          ) : (
            <>📍 Use My Current Location</>
          )}
        </button>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {location && address && (
          <div className="location-result">
            <span className="location-icon">📍</span>
            <span>{address}</span>
          </div>
        )}

        <div className="divider">
          <span>or enter manually</span>
        </div>

        <input
          type="text"
          className="address-input"
          placeholder="Enter delivery address (e.g., Addis Ababa, Bole area, near Edna Mall)"
          value={manualAddress}
          onChange={(e) => setManualAddress(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="actions">
        <button className="btn btn-cancel">Cancel</button>
        <button 
          className="btn btn-confirm"
          onClick={handleConfirm}
          disabled={!location && !manualAddress.trim()}
        >
          Confirm Order
        </button>
      </div>

      <style jsx>{`
        .location-picker {
          max-width: 400px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .authenticated-tag {
          background: #e8f5e9;
          color: #2e7d32;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
        }

        .close-btn {
          width: 32px;
          height: 32px;
          background: #e8f5e9;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          font-size: 16px;
        }

        h2 {
          font-size: 24px;
          margin-bottom: 8px;
        }

        .subtitle {
          color: #666;
          margin-bottom: 24px;
        }

        .order-summary {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .order-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .order-item h3 {
          font-size: 18px;
          margin-bottom: 4px;
        }

        .order-item p {
          color: #666;
          font-size: 14px;
        }

        .order-total {
          display: flex;
          justify-content: space-between;
          font-weight: 600;
          padding-top: 16px;
          border-top: 1px solid #e0e0e0;
        }

        .price {
          font-weight: 600;
        }

        .location-section {
          margin-bottom: 24px;
        }

        .location-section h3 {
          margin-bottom: 16px;
        }

        .location-button {
          width: 100%;
          background: #4ade80;
          color: white;
          border: none;
          padding: 16px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
        }

        .location-button:hover:not(:disabled) {
          background: #22c55e;
          transform: translateY(-1px);
        }

        .location-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .location-button.loading {
          background: #94a3b8;
        }

        .location-button.success {
          background: #22c55e;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #fff;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-message {
          margin-top: 12px;
          padding: 12px;
          background: #fee;
          border: 1px solid #fcc;
          border-radius: 8px;
          color: #c00;
          font-size: 14px;
        }

        .location-result {
          margin-top: 12px;
          padding: 12px;
          background: #f0fdf4;
          border: 2px solid #4ade80;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .divider {
          text-align: center;
          margin: 20px 0;
          color: #999;
          position: relative;
        }

        .divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #e0e0e0;
        }

        .divider span {
          background: white;
          padding: 0 16px;
          position: relative;
        }

        .address-input {
          width: 100%;
          padding: 16px;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          font-size: 16px;
          transition: border-color 0.3s;
        }

        .address-input:focus {
          outline: none;
          border-color: #4ade80;
        }

        .actions {
          display: flex;
          gap: 12px;
          margin-top: 32px;
        }

        .btn {
          flex: 1;
          padding: 16px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-cancel {
          background: #f3f4f6;
          color: #1f2937;
        }

        .btn-confirm {
          background: #4ade80;
          color: white;
        }

        .btn-confirm:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn:hover:not(:disabled) {
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};

export default LocationPicker;