'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Home, Building2, Plus, Clock, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SavedAddress {
  id: string;
  type: 'home' | 'work' | 'other';
  label: string;
  address: string;
  area: string;
  landmark?: string;
  isDefault?: boolean;
}

interface LocationSelectorProps {
  onLocationSelect: (location: any) => void;
  currentLocation?: any;
}

export function LocationSelector({ onLocationSelect, currentLocation }: LocationSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<'current' | 'saved' | 'new'>('saved');
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>('');
  
  // Sample saved addresses - in real app, fetch from database
  const savedAddresses: SavedAddress[] = [
    {
      id: '1',
      type: 'home',
      label: 'Home',
      address: 'Behind Total Gas Station, Green Building, 3rd Floor',
      area: 'Bole, Edna Mall Area',
      landmark: 'Near Edna Mall',
      isDefault: true,
    },
    {
      id: '2',
      type: 'work',
      label: 'Office',
      address: 'ABC Building, 5th Floor',
      area: 'Kazanchis',
      landmark: 'Near National Theater',
    },
  ];

  const [newAddress, setNewAddress] = useState({
    area: '',
    address: '',
    landmark: '',
    label: '',
  });

  // Calculate delivery estimate based on area
  const calculateDeliveryEstimate = (area: string) => {
    const deliveryTimes: Record<string, string> = {
      'Bole': '30-45 mins',
      'Kazanchis': '25-40 mins',
      'Piassa': '35-50 mins',
      'Mercato': '40-55 mins',
      'Default': '45-60 mins',
    };
    
    const estimate = deliveryTimes[area.split(',')[0]] || deliveryTimes['Default'];
    setEstimatedDelivery(estimate);
  };

  const handleAddressSelect = (addressId: string) => {
    const address = savedAddresses.find(a => a.id === addressId);
    if (address) {
      setSelectedAddress(addressId);
      calculateDeliveryEstimate(address.area);
      onLocationSelect(address);
    }
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In real app, reverse geocode to get address
          const currentLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: 'Current Location',
            area: 'Detecting...',
          };
          onLocationSelect(currentLoc);
          setEstimatedDelivery('30-45 mins');
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const handleNewAddressSubmit = () => {
    const address = {
      id: Date.now().toString(),
      type: 'other' as const,
      ...newAddress,
    };
    onLocationSelect(address);
    calculateDeliveryEstimate(newAddress.area);
    setShowNewAddressForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Quick Selection Methods */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          variant={selectedMethod === 'current' ? 'default' : 'outline'}
          className="flex flex-col items-center p-4 h-auto"
          onClick={() => {
            setSelectedMethod('current');
            handleCurrentLocation();
          }}
        >
          <MapPin className="w-5 h-5 mb-1" />
          <span className="text-xs">Current Location</span>
        </Button>
        
        <Button
          variant={selectedMethod === 'saved' ? 'default' : 'outline'}
          className="flex flex-col items-center p-4 h-auto"
          onClick={() => setSelectedMethod('saved')}
        >
          <Home className="w-5 h-5 mb-1" />
          <span className="text-xs">Saved Address</span>
        </Button>
        
        <Button
          variant={selectedMethod === 'new' ? 'default' : 'outline'}
          className="flex flex-col items-center p-4 h-auto"
          onClick={() => {
            setSelectedMethod('new');
            setShowNewAddressForm(true);
          }}
        >
          <Plus className="w-5 h-5 mb-1" />
          <span className="text-xs">New Address</span>
        </Button>
      </div>

      {/* Saved Addresses */}
      {selectedMethod === 'saved' && !showNewAddressForm && (
        <div className="space-y-3">
          {savedAddresses.map((address) => (
            <Card
              key={address.id}
              className={cn(
                "cursor-pointer transition-all",
                selectedAddress === address.id && "border-green-500 bg-green-50"
              )}
              onClick={() => handleAddressSelect(address.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {address.type === 'home' ? (
                      <Home className="w-5 h-5 text-gray-600" />
                    ) : (
                      <Building2 className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{address.label}</h4>
                      {address.isDefault && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{address.area}</p>
                    <p className="text-xs text-gray-500 mt-1">{address.address}</p>
                    {address.landmark && (
                      <p className="text-xs text-gray-400 mt-1">📍 {address.landmark}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setShowNewAddressForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Address
          </Button>
        </div>
      )}
      {/* New Address Form */}
      {showNewAddressForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add New Delivery Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="area">Area/Neighborhood</Label>
              <Select 
                value={newAddress.area} 
                onValueChange={(value) => {
                  setNewAddress({ ...newAddress, area: value });
                  calculateDeliveryEstimate(value);
                }}
              >
                <SelectTrigger id="area">
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bole">Bole</SelectItem>
                  <SelectItem value="Kazanchis">Kazanchis</SelectItem>
                  <SelectItem value="Piassa">Piassa</SelectItem>
                  <SelectItem value="Mercato">Mercato</SelectItem>
                  <SelectItem value="Sarbet">Sarbet</SelectItem>
                  <SelectItem value="Megenagna">Megenagna</SelectItem>
                  <SelectItem value="4 Kilo">4 Kilo</SelectItem>
                  <SelectItem value="6 Kilo">6 Kilo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                placeholder="e.g., Behind Zemen Bank, Blue Building"
                value={newAddress.address}
                onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="landmark">Landmark (Optional)</Label>
              <Input
                id="landmark"
                placeholder="e.g., Near St. Gabriel Church"
                value={newAddress.landmark}
                onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="label">Save As</Label>
              <Input
                id="label"
                placeholder="e.g., Home, Office, Mom's House"
                value={newAddress.label}
                onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowNewAddressForm(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleNewAddressSubmit}
                disabled={!newAddress.area || !newAddress.address}
              >
                Save Address
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delivery Info */}
      {estimatedDelivery && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Estimated Delivery</span>
              </div>
              <span className="text-sm font-semibold text-green-600">{estimatedDelivery}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Delivery Fee</span>
              </div>
              <span className="text-sm font-semibold text-green-600">ETB 50.00</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}