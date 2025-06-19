'use client';

import { useState } from 'react';
import SimpleLocationModal from '../../components/SimpleLocationModal';
import styles from './demo.module.css';

export default function LocationDemo() {
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    console.log('Location selected:', location);
  };

  return (
    <div className={styles.container}>
      {/* Simulated Order Modal */}
      <div className={styles.orderModal}>
        <div className={styles.header}>
          <span className={styles.authenticated}>Authenticated</span>
          <button className={styles.closeBtn}>✕</button>
        </div>

        <h1>Complete Your Order</h1>
        <p className={styles.subtitle}>Review your items and confirm delivery details</p>

        {/* Order Summary */}
        <div className={styles.orderBox}>
          <div className={styles.orderItem}>
            <div>
              <h3>papaya</h3>
              <p>1000g (ETB 80/kg)</p>
            </div>
            <span>ETB 80.00</span>
          </div>
          <div className={styles.total}>
            <span>Total:</span>
            <span>ETB 80.00</span>
          </div>
        </div>

        {/* Contact & Delivery */}
        <div className={styles.section}>
          <h3>Contact & Delivery Details</h3>
          
          <div className={styles.contactInfo}>
            <p>👤 Yosef</p>
            <p>📱 +251944113998</p>
          </div>

          <div className={styles.locationSection}>
            <label>📍 Delivery Address for This Order*</label>
            
            {selectedLocation ? (
              <div className={styles.selectedLocation}>
                <p>{selectedLocation.address}</p>
                <button 
                  className={styles.changeBtn}
                  onClick={() => setShowLocationModal(true)}
                >
                  Change
                </button>
              </div>
            ) : (
              <button 
                className={styles.selectLocationBtn}
                onClick={() => setShowLocationModal(true)}
              >
                Select Delivery Location
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.cancelBtn}>Cancel</button>
          <button 
            className={styles.confirmBtn}
            disabled={!selectedLocation}
          >
            Confirm Order
          </button>
        </div>
      </div>

      {/* Location Modal */}
      <SimpleLocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSelect={handleLocationSelect}
      />
    </div>
  );
}