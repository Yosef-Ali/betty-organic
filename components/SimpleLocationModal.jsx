'use client';

import { useState } from 'react';
import styles from './SimpleLocation.module.css';

export default function SimpleLocationModal({ isOpen, onClose, onLocationSelect }) {
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  
  const savedLocations = [
    { id: 'home', name: 'Home', address: 'Bole, near Edna Mall' },
    { id: 'office', name: 'Office', address: 'Kazanchis, near National Theater' },
  ];

  const getCurrentLocation = () => {
    setLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Get address from coordinates
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          const addr = data.display_name || `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setAddress(addr);
          setSelectedOption('current');
        } catch (error) {
          setAddress(`Location found: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          setSelectedOption('current');
        }
        
        setLoading(false);
      },
      (error) => {
        alert('Could not get location. Please enter manually.');
        setLoading(false);
      }
    );
  };

  const handleConfirm = () => {
    if (address || selectedOption) {
      let finalAddress = address;
      
      if (selectedOption && selectedOption !== 'current' && selectedOption !== 'manual') {
        const saved = savedLocations.find(loc => loc.id === selectedOption);
        if (saved) finalAddress = saved.address;
      }
      
      onLocationSelect({ address: finalAddress });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>📍 Select Delivery Location</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.content}>
          {/* Current Location */}
          <button
            className={`${styles.option} ${selectedOption === 'current' ? styles.selected : ''}`}
            onClick={getCurrentLocation}
            disabled={loading}
          >
            <div className={styles.optionIcon}>📍</div>
            <div className={styles.optionContent}>
              <strong>Use Current Location</strong>
              {loading && <span className={styles.loading}>Getting location...</span>}
              {selectedOption === 'current' && address && (
                <span className={styles.address}>{address}</span>
              )}
            </div>
          </button>

          {/* Saved Locations */}
          <div className={styles.divider}>
            <span>Or choose saved location</span>
          </div>

          {savedLocations.map((loc) => (
            <button
              key={loc.id}
              className={`${styles.option} ${selectedOption === loc.id ? styles.selected : ''}`}
              onClick={() => {
                setSelectedOption(loc.id);
                setAddress(loc.address);
              }}
            >
              <div className={styles.optionIcon}>
                {loc.name === 'Home' ? '🏠' : '🏢'}
              </div>
              <div className={styles.optionContent}>
                <strong>{loc.name}</strong>
                <span className={styles.address}>{loc.address}</span>
              </div>
            </button>
          ))}

          {/* Manual Entry */}
          <div className={styles.divider}>
            <span>Or enter manually</span>
          </div>

          <textarea
            className={styles.manualInput}
            placeholder="Enter your delivery address..."
            rows="3"
            value={selectedOption === 'manual' ? address : ''}
            onChange={(e) => {
              setAddress(e.target.value);
              setSelectedOption('manual');
            }}
          />
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={!address && !selectedOption}
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
}