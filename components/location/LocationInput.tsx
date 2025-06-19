'use client';

import React, { useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { LocationSelector } from './LocationSelector';

interface LocationInputProps {
  value?: any;
  onChange: (location: any) => void;
  placeholder?: string;
  className?: string;
}

export function LocationInput({ 
  value, 
  onChange, 
  placeholder = "Select delivery location",
  className 
}: LocationInputProps) {
  const [open, setOpen] = useState(false);

  const handleLocationSelect = (location: any) => {
    onChange(location);
    setOpen(false);
  };

  const displayValue = value ? 
    `${value.area}${value.landmark ? ', ' + value.landmark : ''}` : 
    placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-between font-normal ${className}`}
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className={value ? 'text-gray-900' : 'text-gray-500'}>
              {displayValue}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="p-4">
          <LocationSelector 
            onLocationSelect={handleLocationSelect}
            currentLocation={value}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}