'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MapPin, Home, Building, Navigation, ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleLocationPickerProps {
    onLocationSelectAction: (location: { address: string }) => void;
    onCancelAction: () => void;
    currentAddress?: string;
}

export default function CollapsibleLocationPicker({ onLocationSelectAction, onCancelAction, currentAddress }: CollapsibleLocationPickerProps) {
    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState(currentAddress || '');
    const [selectedOption, setSelectedOption] = useState('');
    const [isOpen, setIsOpen] = useState(false);

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
                        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`
                    );
                    const data = await response.json();

                    if (data.features && data.features.length > 0) {
                        const locationAddress = data.features[0].place_name;
                        setAddress(locationAddress);
                        setSelectedOption('current');
                    } else {
                        setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                        setSelectedOption('current');
                    }
                } catch (error) {
                    console.error('Error getting address:', error);
                    setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                    setSelectedOption('current');
                } finally {
                    setLoading(false);
                }
            },
            (error) => {
                console.error('Error getting location:', error);
                setLoading(false);
                alert('Unable to get your location. Please enable location services.');
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

            onLocationSelectAction({ address: finalAddress });
            setIsOpen(false); // Close after confirming
        }
    };

    return (
        <div className="space-y-2">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full justify-between gap-2 h-auto p-3"
                        type="button"
                    >
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">
                                {address ? 'Change Location' : 'Select Delivery Location'}
                            </span>
                        </div>
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="space-y-3 pb-2">
                    <ScrollArea className="max-h-[250px] sm:max-h-[300px]">
                        <div className="border rounded-lg p-4 space-y-4 bg-gray-50 mt-2 mb-2">
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
                                <Button variant="outline" onClick={onCancelAction} className="flex-1">
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
                    </ScrollArea>
                </CollapsibleContent>
            </Collapsible>

            {/* Show selected address when collapsed */}
            {!isOpen && address && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">{address}</p>
                </div>
            )}
        </div>
    );
}
