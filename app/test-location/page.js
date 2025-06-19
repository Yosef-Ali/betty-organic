'use client';

import { useLocation } from '../../hooks/useLocation';

export default function TestLocation() {
  const { location, address, loading, error, getCurrentLocation } = useLocation();

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Location Test</h1>
      
      <button
        onClick={getCurrentLocation}
        disabled={loading}
        style={{
          width: '100%',
          padding: '16px',
          fontSize: '16px',
          backgroundColor: loading ? '#ccc' : '#4ade80',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Getting Location...' : 'Get My Location'}
      </button>

      {error && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '8px',
          color: '#c00',
        }}>
          Error: {error}
        </div>
      )}

      {location && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#efe',
          border: '1px solid #cfc',
          borderRadius: '8px',
        }}>
          <p><strong>Location found!</strong></p>
          <p>Lat: {location.latitude}</p>
          <p>Lng: {location.longitude}</p>
          {address && <p>Address: {address}</p>}
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h3>Troubleshooting:</h3>
        <ol>
          <li>Make sure you're using HTTPS (location doesn't work on HTTP)</li>
          <li>Check browser settings for location permissions</li>
          <li>For Chrome: Settings → Privacy → Site Settings → Location</li>
          <li>Try in an incognito window to rule out extensions</li>
        </ol>
      </div>
    </div>
  );
}