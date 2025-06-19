'use client';

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronLeft, Home, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface LocationPickerProps {
  isOpen: boolean;
  onBack: () => void;
  onLocationSelect: (location: { address: string }) => void;
  currentAddress?: string;
}

export default function LocationPickerSlide({ 
  isOpen, 
  onBack, 
  onLocationSelect,
  currentAddress 
}: LocationPickerProps) {
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState(currentAddress || '');
  const [selectedOption, setSelectedOption] = useState('');
  
  const savedLocations = [
    { id: 'home', name: 'Home', address: 'Bole, near Edna Mall', icon: Home },
    { id: 'office', name: 'Office', address: 'Kazanchis, near National Theater', icon: Building },
  ];

  const getCurrentLocation = () => {
    setLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
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
    if (address) {
      onLocationSelect({ address });
      onBack();
    }
  };

  const handleSavedLocation = (loc: typeof savedLocations[0]) => {
    setSelectedOption(loc.id);
    setAddress(loc.address);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="absolute inset-0 bg-white z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold flex-1">Select Delivery Location</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Current Location Button */}
          <button
            className={`w-full p-4 rounded-lg border-2 transition-all ${
              selectedOption === 'current' 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={getCurrentLocation}
            disabled={loading}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium">Use Current Location</p>
                {loading && <p className="text-sm text-gray-500">Getting location...</p>}
                {selectedOption === 'current' && address && (
                  <p className="text-sm text-gray-600 mt-1">{address}</p>
                )}
              </div>
            </div>
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-500">Or choose saved location</span>
            </div>
          </div>

          {/* Saved Locations */}
          {savedLocations.map((loc) => {
            const Icon = loc.icon;
            return (
              <button
                key={loc.id}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  selectedOption === loc.id 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleSavedLocation(loc)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{loc.name}</p>
                    <p className="text-sm text-gray-600">{loc.address}</p>
                  </div>
                </div>
              </button>
            );
          })}

          {/* Manual Entry */}
          <div className="space-y-2 pt-4">
            <Label className="text-sm text-gray-600">Or enter manually</Label>
            <Textarea
              placeholder="Enter your delivery address..."
              value={selectedOption === 'manual' ? address : ''}
              onChange={(e) => {
                setAddress(e.target.value);
                setSelectedOption('manual');
              }}
              className="min-h-[100px]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <Button
            onClick={handleConfirm}
            disabled={!address}
            className="w-full"
            size="lg"
          >
            Confirm Location
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}