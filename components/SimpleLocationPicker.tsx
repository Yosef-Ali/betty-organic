'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MapPin, Home, Building, Navigation, ChevronDown, ChevronUp } from 'lucide-react';

interface SimpleLocationPickerProps {
  onLocationSelect: (location: { address: string }) => void;
  onCancel: () => void;
}

export default function SimpleLocationPicker({ onLocationSelect, onCancel }: SimpleLocationPickerProps) {
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
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
    if (address || selectedOption) {
      let finalAddress = address;

      if (selectedOption && selectedOption !== 'current' && selectedOption !== 'manual') {
        const saved = savedLocations.find(loc => loc.id === selectedOption);
        if (saved) finalAddress = saved.address;
      }

      onLocationSelect({ address: finalAddress });
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Select Delivery Location
        </h3>
        <Button variant="ghost" size="sm" onClick={onCancel} className="text-xs">
          Cancel
        </Button>
      </div>

      {/* Current Location */}
      <button
        className={`w-full p-3 border rounded-lg text-left transition-colors flex items-center gap-3 ${selectedOption === 'current'
            ? 'border-green-500 bg-green-50'
            : 'border-gray-200 hover:border-green-300 bg-white'
          }`}
        onClick={getCurrentLocation}
        disabled={loading}
      >
        <Navigation className="w-5 h-5 text-gray-600" />
        <div className="flex-1">
          <div className="font-medium text-sm">Use Current Location</div>
          {loading && <div className="text-xs text-gray-500 mt-1">Getting location...</div>}
          {selectedOption === 'current' && address && (
            <div className="text-xs text-green-700 mt-1">{address}</div>
          )}
        </div>
      </button>

      {/* Saved Locations */}
      <div className="space-y-2">
        <div className="text-xs text-gray-500 text-center">Or choose saved location</div>
        {savedLocations.map((loc) => {
          const IconComponent = loc.icon;
          return (
            <button
              key={loc.id}
              className={`w-full p-3 border rounded-lg text-left transition-colors flex items-center gap-3 ${selectedOption === loc.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300 bg-white'
                }`}
              onClick={() => {
                setSelectedOption(loc.id);
                setAddress(loc.address);
              }}
            >
              <IconComponent className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <div className="font-medium text-sm">{loc.name}</div>
                <div className="text-xs text-gray-500">{loc.address}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Manual Entry */}
      <div className="space-y-2">
        <div className="text-xs text-gray-500 text-center">Or enter manually</div>
        <Textarea
          placeholder="Enter your delivery address..."
          rows={3}
          value={selectedOption === 'manual' ? address : ''}
          onChange={(e) => {
            setAddress(e.target.value);
            setSelectedOption('manual');
          }}
          className="resize-none"
        />
      </div>

      {/* Confirm Button */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!address && !selectedOption}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          Confirm Location
        </Button>
      </div>
    </div>
  );
}