"use client";

import React from "react";
import { CartItemType } from "@/types/cart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { MessageCircle, MapPin, User, Phone } from "lucide-react";
import { createInfoChangeHandler } from "./utils";
import { AuthenticatedFormProps } from "./types";

export const AuthenticatedForm: React.FC<AuthenticatedFormProps> = ({
    items,
    total,
    customerInfo,
    setCustomerInfoAction,
    isSubmitting,
    handleConfirmAction,
    onCancelAction,
    isCustomerInfoValidAction,
    profileData,
    userEmail,
}: AuthenticatedFormProps) => {
    const handleInfoChange = createInfoChangeHandler('address', setCustomerInfoAction);

    return (
        <>
            <DialogHeader>
                <DialogTitle>Complete Your Order</DialogTitle>
                <DialogDescription>
                    Review your items and confirm delivery details
                </DialogDescription>
            </DialogHeader>

            {/* Order items */}
            <ScrollArea className="max-h-[200px] mt-4 mb-4 border rounded-lg p-3">
                <div className="space-y-4">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="flex justify-between items-center py-2 border-b"
                        >
                            <div className="flex flex-col">
                                <span className="font-medium">{item.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">{item.grams}g</span>
                                    <span className="text-xs text-gray-400">
                                        (ETB {item.pricePerKg}/kg)
                                    </span>
                                </div>
                            </div>
                            <span className="font-medium">
                                ETB {((item.pricePerKg * item.grams) / 1000).toFixed(2)}
                            </span>
                        </div>
                    ))}
                    <div className="pt-4 border-t flex justify-between font-bold">
                        <span>Total:</span>
                        <span>ETB {total.toFixed(2)}</span>
                    </div>
                </div>
            </ScrollArea>

            {/* Simple user info and delivery address only */}
            <div className="rounded-lg border p-3 space-y-4">
                <h3 className="font-medium text-sm">Contact & Delivery Details</h3>

                {/* Profile summary */}
                <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">
                            {profileData?.name || userEmail?.split('@')[0]}
                        </span>
                    </div>
                    {profileData?.phone && (
                        <div className="flex items-center gap-2 mb-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{profileData.phone}</span>
                        </div>
                    )}
                </div>

                {/* Address field */}
                <div className="space-y-2">
                    <Label htmlFor="address" className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">Delivery Address for This Order*</span>
                    </Label>
                    <div className="space-y-2">
                        <Textarea
                            id="address"
                            placeholder="Enter delivery address for this order (e.g., Addis Ababa, Bole area, near Edna Mall)"
                            value={customerInfo.address}
                            onChange={handleInfoChange}
                            required
                            className="min-h-[80px] w-full resize-none"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                                try {
                                    if (!navigator.geolocation) {
                                        alert('📍 Location not supported. Please enter your address manually.');
                                        return;
                                    }
                                    
                                    alert('📍 Getting your location... Please allow location access when prompted.');
                                    
                                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                                        navigator.geolocation.getCurrentPosition(
                                            resolve, 
                                            reject, 
                                            {
                                                enableHighAccuracy: true,
                                                timeout: 10000,
                                                maximumAge: 60000
                                            }
                                        );
                                    });
                                    
                                    const { latitude, longitude } = position.coords;
                                    
                                    // Simple coordinate-based address for Ethiopia
                                    const lat = latitude.toFixed(6);
                                    const lon = longitude.toFixed(6);
                                    
                                    let locationText = `📍 My Location: ${lat}, ${lon}`;
                                    
                                    // Add Ethiopian city context based on coordinates
                                    if (latitude >= 8.5 && latitude <= 9.5 && longitude >= 38.5 && longitude <= 39.0) {
                                        locationText += ' (Addis Ababa area)';
                                    } else if (latitude >= 6.0 && latitude <= 15.0 && longitude >= 33.0 && longitude <= 48.0) {
                                        locationText += ' (Ethiopia)';
                                    }
                                    
                                    setCustomerInfo(prev => ({ ...prev, address: locationText }));
                                    alert('✅ Location detected! Please add specific details like building name, area, landmarks, etc.');
                                    
                                } catch (error: any) {
                                    console.log('Geolocation error:', error);
                                    let message = '❌ Could not get location. ';
                                    
                                    if (error.code === 1) {
                                        message += 'Please allow location access and try again.';
                                    } else if (error.code === 2) {
                                        message += 'Location unavailable.';
                                    } else if (error.code === 3) {
                                        message += 'Location request timed out.';
                                    } else {
                                        message += 'Please enter your address manually.';
                                    }
                                    
                                    alert(message);
                                }
                            }}
                            className="gap-2 text-xs"
                        >
                            <MapPin className="w-3 h-3" />
                            Use Current Location
                        </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                        Enter where you want this order delivered (can be different from your profile address)
                    </p>
                </div>
            </div>

            <DialogFooter className="flex items-center justify-between mt-4">
                <Button variant="outline" onClick={onCancelAction}>
                    Cancel
                </Button>
                <Button
                    onClick={handleConfirmAction}
                    disabled={isSubmitting || !isCustomerInfoValidAction()}
                    className="gap-1"
                >
                    <MessageCircle className="w-4 h-4" />
                    {isSubmitting ? 'Processing...' : 'Confirm Order'}
                </Button>
            </DialogFooter>
        </>
    );
};
