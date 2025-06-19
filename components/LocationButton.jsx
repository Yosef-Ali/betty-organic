// Simple working example for your order page
'use client';

import { useState } from 'react';

export default function LocationButton() {
  const [loading, setLoading] = useState(false);
  const [locationText, setLocationText] = useState('');
  const [error, setError] = useState('');

  const handleGetLocation = () => {
    setError('');
    setLoading(true);

    if (!navigator.geolocation) {
      setError('Browser does not support location');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Success
        const { latitude, longitude } = position.coords;
        setLocationText(`Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        setLoading(false);
        setError('');
      },
      (err) => {
        // Error
        setLoading(false);
        setError('Could not get location. Please enter manually.');
        console.error('Location error:', err);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  return (
    <div>
      <button
        onClick={handleGetLocation}
        disabled={loading}
        style={{
          padding: '12px 24px',
          backgroundColor: '#4ade80',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Getting location...' : '📍 Use My Location'}
      </button>
      
      {locationText && (
        <p style={{ color: 'green', marginTop: '10px' }}>
          ✅ {locationText}
        </p>
      )}
      
      {error && (
        <p style={{ color: 'red', marginTop: '10px' }}>
          ❌ {error}
        </p>
      )}
    </div>
  );
}