// Simple location hook for Next.js
import { useState, useCallback } from 'react';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getCurrentLocation = useCallback(() => {
    // Reset states
    setError('');
    setLoading(true);

    // Check if browser supports geolocation
    if (!navigator?.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }

    // Get current position
    navigator.geolocation.getCurrentPosition(
      // Success callback
      async (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        
        setLocation(coords);
        
        // Try to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`
          );
          const data = await response.json();
          
          if (data.display_name) {
            setAddress(data.display_name);
          } else {
            setAddress(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
          }
        } catch {
          setAddress(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
        }
        
        setLoading(false);
      },
      // Error callback
      (error) => {
        console.error('Geolocation error:', error);
        
        let errorMsg = 'Could not get location';
        
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            errorMsg = 'Location access denied. Please enable it in browser settings.';
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMsg = 'Location unavailable. Please try again.';
            break;
          case 3: // TIMEOUT
            errorMsg = 'Location request timed out. Please try again.';
            break;
        }
        
        setError(errorMsg);
        setLoading(false);
      },
      // Options
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  return {
    location,
    address,
    loading,
    error,
    getCurrentLocation,
  };
};