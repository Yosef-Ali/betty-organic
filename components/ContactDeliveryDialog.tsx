'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { User, Phone, MapPin, Home, Building, Navigation, Loader2 } from 'lucide-react';
import { getUser } from '@/app/actions/auth';
import { getProfile, updateUserProfile } from '@/app/actions/profile';
import { toast } from 'sonner';

interface ContactDeliveryDialogProps {
    isOpen: boolean;
    onOpenChangeAction: (open: boolean) => void;
    customerInfo: {
        name: string;
        phone: string;
        address: string;
    };
    onCustomerInfoChangeAction: (info: { name: string; phone: string; address: string }) => void;
}

export const ContactDeliveryDialog = ({
    isOpen,
    onOpenChangeAction,
    customerInfo,
    onCustomerInfoChangeAction
}: ContactDeliveryDialogProps) => {
    const [activeTab, setActiveTab] = useState('contact');
    const [loading, setLoading] = useState(false);
    const [selectedOption, setSelectedOption] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState({ phone: '', address: '' });

    // Authentication and profile state
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [profileData, setProfileData] = useState<any | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    const savedLocations = [
        { id: 'home', name: 'Home', address: 'Bole, near Edna Mall', icon: Home },
        { id: 'office', name: 'Office', address: 'Kazanchis, near National Theater', icon: Building },
    ];

    // Fetch user profile data from database
    const fetchUserProfile = useCallback(async () => {
        setIsLoadingProfile(true);

        try {
            console.log("🔄 [CONTACT_DIALOG] Fetching user session...");
            const user = await getUser();

            if (user) {
                console.log("✅ [CONTACT_DIALOG] User found, fetching profile...");
                setIsAuthenticated(true);
                setUserEmail(user.email || null);

                // Use profile from getUser() or fetch separately if needed
                let profile = user.profile;
                if (!profile) {
                    profile = await getProfile(user.id);
                }
                console.log("👤 [CONTACT_DIALOG] Profile data:", profile);
                setProfileData(profile);

                if (profile) {
                    // Pre-populate form with existing profile data
                    onCustomerInfoChangeAction({
                        name: profile.name || user.email?.split('@')[0] || '',
                        phone: profile.phone || '',
                        address: profile.address || customerInfo.address || ''
                    });
                    console.log("✅ [CONTACT_DIALOG] Form pre-populated with profile data");
                } else {
                    // No profile found, use email-based name
                    onCustomerInfoChangeAction({
                        name: user.email?.split('@')[0] || '',
                        phone: '',
                        address: customerInfo.address || ''
                    });
                    console.log("⚠️ [CONTACT_DIALOG] No profile found, using email-based data");
                }
            } else {
                console.log("❌ [CONTACT_DIALOG] No user session found");
                setIsAuthenticated(false);
                setProfileData(null);
                setUserEmail(null);
            }
        } catch (error) {
            console.error("❌ [CONTACT_DIALOG] Error fetching profile:", error);
            toast.error("Failed to load your profile. Please try again.");
            setIsAuthenticated(false);
            setProfileData(null);
        } finally {
            setIsLoadingProfile(false);
        }
    }, [customerInfo.address, onCustomerInfoChangeAction]);

    // Fetch profile when dialog opens
    useEffect(() => {
        if (isOpen && !isLoadingProfile && isAuthenticated === null) {
            fetchUserProfile();
        }
    }, [isOpen, fetchUserProfile, isLoadingProfile, isAuthenticated]);

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
                        onCustomerInfoChangeAction({ ...customerInfo, address: locationAddress });
                        setSelectedOption('current');
                        // Clear address error when location is found
                        if (errors.address) {
                            setErrors(prev => ({ ...prev, address: '' }));
                        }
                    } else {
                        const coords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                        onCustomerInfoChangeAction({ ...customerInfo, address: coords });
                        setSelectedOption('current');
                        // Clear address error
                        if (errors.address) {
                            setErrors(prev => ({ ...prev, address: '' }));
                        }
                    }
                } catch (error) {
                    console.error('Error getting address:', error);
                    const coords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                    onCustomerInfoChangeAction({ ...customerInfo, address: coords });
                    setSelectedOption('current');
                    // Clear address error
                    if (errors.address) {
                        setErrors(prev => ({ ...prev, address: '' }));
                    }
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

    const validateForm = () => {
        const newErrors = { phone: '', address: '' };
        let isValid = true;

        // Validate phone number - required for all users
        const phoneRegex = /^(\+251|0)[9]\d{8}$/; // Ethiopian phone format
        if (!customerInfo.phone.trim()) {
            newErrors.phone = 'Phone number is required';
            isValid = false;
        } else if (!phoneRegex.test(customerInfo.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Please enter a valid Ethiopian phone number (09XXXXXXXX or +251XXXXXXXXX)';
            isValid = false;
        }

        // Validate address - required for all users
        if (!customerInfo.address.trim()) {
            newErrors.address = 'Delivery address is required';
            isValid = false;
        } else if (customerInfo.address.trim().length < 5) {
            newErrors.address = 'Please provide a more detailed address (minimum 5 characters)';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSave = async () => {
        setIsSaving(true);

        try {
            // Clear previous errors
            setErrors({ phone: '', address: '' });

            // Validate form
            if (!validateForm()) {
                // Switch to the tab with the first error
                if (errors.phone) {
                    setActiveTab('contact');
                } else if (errors.address) {
                    setActiveTab('delivery');
                }
                return;
            }

            // Save to database if user is authenticated
            if (isAuthenticated && userEmail) {
                try {
                    console.log("💾 [CONTACT_DIALOG] Saving profile to database...");
                    await updateUserProfile({
                        name: customerInfo.name,
                        phone: customerInfo.phone,
                        address: customerInfo.address
                    });
                    console.log("✅ [CONTACT_DIALOG] Profile saved to database successfully");
                    toast.success("Profile updated successfully!");
                } catch (error) {
                    console.error("❌ [CONTACT_DIALOG] Error saving profile:", error);
                    toast.error("Failed to save profile to database, but details were saved locally.");
                }
            }

            // Close dialog with success
            onOpenChangeAction(false);

            // Show success feedback
            const successMessage = isAuthenticated
                ? "Contact details saved to your profile!"
                : "Contact details saved for this order!";

            toast.success(successMessage);

        } catch (error) {
            console.error('Error saving contact details:', error);
            toast.error('Failed to save contact details. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const isContactComplete = customerInfo.phone.trim();
    const isDeliveryComplete = customerInfo.address.trim();

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChangeAction}>
            <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="text-lg">Contact & Delivery Details</DialogTitle>
                    <DialogDescription className="text-sm">
                        {isLoadingProfile ? (
                            "Loading your profile information..."
                        ) : isAuthenticated ? (
                            "Review and update your contact information and delivery address"
                        ) : (
                            "Provide your contact information and delivery address"
                        )}
                    </DialogDescription>
                </DialogHeader>

                {/* Show loading state while fetching profile */}
                {isLoadingProfile ? (
                    <div className="flex-1 flex items-center justify-center py-8">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                            <p className="text-sm text-gray-500">Loading your information...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Tabbed interface for better organization */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="contact" className="text-xs">
                                    <Phone className="w-3 h-3 mr-1" />
                                    Contact
                                    {isContactComplete && <span className="ml-1 text-green-600">✓</span>}
                                </TabsTrigger>
                                <TabsTrigger value="delivery" className="text-xs">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    Delivery
                                    {isDeliveryComplete && <span className="ml-1 text-green-600">✓</span>}
                                </TabsTrigger>
                            </TabsList>

                            <ScrollArea className="flex-1">
                                <div className="pr-4">
                                    <TabsContent value="contact" className="space-y-4 mt-0">
                                        <div className="space-y-2">
                                            <Label htmlFor="contact-name" className="flex items-center gap-2 text-sm">
                                                <User className="w-4 h-4 flex-shrink-0" />
                                                <span>Your Name (optional)</span>
                                            </Label>
                                            <Input
                                                id="contact-name"
                                                placeholder="Enter your name"
                                                value={customerInfo.name}
                                                onChange={(e) => onCustomerInfoChangeAction({ ...customerInfo, name: e.target.value })}
                                                className="h-9 text-sm"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="contact-phone" className="flex items-center gap-2 text-sm">
                                                <Phone className="w-4 h-4 flex-shrink-0" />
                                                <span>Phone Number*</span>
                                            </Label>
                                            <Input
                                                id="contact-phone"
                                                placeholder="e.g., 0911234567"
                                                value={customerInfo.phone}
                                                onChange={(e) => {
                                                    onCustomerInfoChangeAction({ ...customerInfo, phone: e.target.value });
                                                    // Clear error when user starts typing
                                                    if (errors.phone) {
                                                        setErrors(prev => ({ ...prev, phone: '' }));
                                                    }
                                                }}
                                                required
                                                className={`h-9 text-sm ${errors.phone ? 'border-red-500 focus:border-red-500' : ''}`}
                                            />
                                            {errors.phone && (
                                                <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
                                            )}
                                            {!errors.phone && (
                                                <p className="text-xs text-gray-500">
                                                    Format: 09XXXXXXXX or +251XXXXXXXXX
                                                </p>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="delivery" className="space-y-4 mt-0">
                                        <div className="space-y-2">
                                            <Label htmlFor="contact-address" className="flex items-center gap-2 text-sm">
                                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                                <span>Delivery Address*</span>
                                            </Label>

                                            {errors.address && (
                                                <div className="p-2 bg-red-50 border border-red-200 rounded-md">
                                                    <p className="text-xs text-red-600">{errors.address}</p>
                                                </div>
                                            )}

                                            {/* Direct Address Form - No Collapse */}
                                            <div className="space-y-3">
                                                {/* Current Location */}
                                                <button
                                                    type="button"
                                                    className={`w-full p-3 border rounded-lg text-left transition-colors flex items-center gap-3 ${selectedOption === 'current'
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-200 hover:border-green-300 bg-white'
                                                        }`}
                                                    onClick={getCurrentLocation}
                                                    disabled={loading}
                                                >
                                                    <Navigation className="w-4 h-4 text-gray-600" />
                                                    <div className="flex-1">
                                                        <div className="font-medium text-sm">Use Current Location</div>
                                                        {loading && <div className="text-xs text-gray-500 mt-1">Getting location...</div>}
                                                        {selectedOption === 'current' && customerInfo.address && (
                                                            <div className="text-xs text-green-700 mt-1">{customerInfo.address}</div>
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
                                                                type="button"
                                                                className={`w-full p-3 border rounded-lg text-left transition-colors flex items-center gap-3 ${selectedOption === loc.id
                                                                    ? 'border-green-500 bg-green-50'
                                                                    : 'border-gray-200 hover:border-green-300 bg-white'
                                                                    }`}
                                                                onClick={() => {
                                                                    setSelectedOption(loc.id);
                                                                    onCustomerInfoChangeAction({ ...customerInfo, address: loc.address });
                                                                    // Clear address error when selecting saved location
                                                                    if (errors.address) {
                                                                        setErrors(prev => ({ ...prev, address: '' }));
                                                                    }
                                                                }}
                                                            >
                                                                <IconComponent className="w-4 h-4 text-gray-600" />
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
                                                        value={customerInfo.address}
                                                        onChange={(e) => {
                                                            onCustomerInfoChangeAction({ ...customerInfo, address: e.target.value });
                                                            setSelectedOption('manual');
                                                            // Clear error when user starts typing
                                                            if (errors.address) {
                                                                setErrors(prev => ({ ...prev, address: '' }));
                                                            }
                                                        }}
                                                        className={`resize-none text-sm ${errors.address ? 'border-red-500 focus:border-red-500' : ''}`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </div>
                            </ScrollArea>
                        </Tabs>
                    </>
                )}

                <DialogFooter className="flex-shrink-0 pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChangeAction(false)}
                        className="flex-1"
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="flex-1 ml-2"
                        disabled={isSaving || !customerInfo.phone.trim() || !customerInfo.address.trim()}
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Saving...
                            </>
                        ) : (
                            'Save Details'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
