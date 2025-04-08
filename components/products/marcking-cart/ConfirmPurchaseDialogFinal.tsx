"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CartItemType } from "@/types/cart";
import { useState, useEffect } from "react";
import { useMarketingCartStore } from "@/store/cartStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { handlePurchaseOrder } from "@/app/actions/purchaseActions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { sendWhatsAppOrderNotification } from "@/app/(marketing)/actions/notificationActions";
import {
    MapPin,
    Phone,
    User,
    MessageCircle,
    LogIn,
    Share2,
    Loader,
} from "lucide-react";
import { createClient } from '@/lib/supabase/client';

interface CustomerInfo {
    name: string;
    phone: string;
    address: string;
}

interface ConfirmPurchaseDialogProps {
    isOpen: boolean;
    onCloseAction: () => void;
    items: CartItemType[];
    total: number;
}

// Loading state component
const LoadingSpinner = () => (
    <div className="py-8 flex flex-col items-center justify-center gap-3">
        <Loader className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
            Checking authentication status...
        </p>
    </div>
);

export const ConfirmPurchaseDialogFinal = ({
    isOpen,
    onCloseAction,
    items,
    total,
}: ConfirmPurchaseDialogProps) => {
    // Auth states
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [profileData, setProfileData] = useState<any | null>(null);

    // UI states
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOrderPlaced, setIsOrderPlaced] = useState(false);
    const [orderDetails, setOrderDetails] = useState<any>(null);

    // Customer info
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
        name: "",
        phone: "",
        address: "",
    });

    const clearCart = useMarketingCartStore((state) => state.clearCart);
    const router = useRouter();
    const supabase = createClient();

    // Direct auth check on component mount AND whenever dialog opens
    useEffect(() => {
        const checkAuth = async () => {
            console.log("🔍 Directly checking authentication status...");
            setIsLoading(true);

            try {
                // Directly query Supabase
                const { data: { user } } = await supabase.auth.getUser();

                console.log("🔐 Auth check result:", {
                    user: user ? "exists" : "none",
                    id: user?.id,
                    email: user?.email
                });

                // Update auth state
                if (user?.id) {
                    setIsAuthenticated(true);
                    setUserId(user.id);
                    setUserEmail(user.email);

                    // Get profile data
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single();

                    if (profile) {
                        console.log("👤 Profile found:", {
                            name: profile.name,
                            phone: profile.phone,
                            address: profile.address
                        });

                        setProfileData(profile);
                        setCustomerInfo({
                            name: profile.name || user.email?.split('@')[0] || '',
                            phone: profile.phone || '',
                            address: profile.address || ''
                        });
                    } else {
                        console.log("⚠️ No profile found for authenticated user");
                        if (user.email) {
                            setCustomerInfo(prev => ({
                                ...prev,
                                name: user.email?.split('@')[0] || ''
                            }));
                        }
                    }
                } else {
                    setIsAuthenticated(false);
                    setUserId(null);
                    setUserEmail(null);
                    setProfileData(null);
                }
            } catch (error) {
                console.error("❌ Auth check error:", error);
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        // Run auth check immediately on mount
        checkAuth();

        // Also check whenever dialog opens
        if (isOpen) {
            checkAuth();
        }
    }, [isOpen]);

    // Form handlers
    const handleInfoChange = (field: keyof CustomerInfo) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setCustomerInfo(prev => ({
            ...prev,
            [field]: e.target.value,
        }));
    };

    const isCustomerInfoValid = () => {
        if (isAuthenticated) {
            // For authenticated users, only delivery address is required
            return customerInfo.address.trim().length > 0;
        } else {
            // For guests, both phone and address are required
            return (
                customerInfo.phone.length >= 9 &&
                customerInfo.address.trim().length > 0
            );
        }
    };

    const formatPhoneNumber = (phone: string) => {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('251')) {
            return `+${cleaned}`;
        } else if (cleaned.startsWith('0')) {
            return `+251${cleaned.slice(1)}`;
        }
        return `+251${cleaned}`;
    };

    const handleSignIn = () => {
        localStorage.setItem(
            'pendingCart',
            JSON.stringify({
                items,
                customerInfo,
                timestamp: Date.now(),
            })
        );
        router.push('/auth/login?returnTo=/');
    };

    const handleShareWhatsApp = () => {
        if (!orderDetails) return;
        sendWhatsAppOrderNotification(orderDetails)
            .then(() => toast.success('WhatsApp notification ready!'))
            .catch((err: Error) => {
                console.error('Failed to prepare WhatsApp notification:', err.message);
                toast.error('Failed to prepare WhatsApp message.');
            });
    };

    const handleConfirm = async () => {
        try {
            console.log("💾 Confirming order as:", isAuthenticated ? "authenticated user" : "guest");
            setIsSubmitting(true);

            if (!items.length) {
                throw new Error('No items in cart');
            }

            if (!isCustomerInfoValid()) {
                throw new Error(
                    isAuthenticated
                        ? 'Please provide a delivery address'
                        : 'Please provide valid contact information'
                );
            }

            // Prepare customer data
            const customerName =
                isAuthenticated
                    ? profileData?.name || userEmail?.split('@')[0] || 'Customer'
                    : customerInfo.name || 'Guest';

            const customerPhone =
                isAuthenticated && profileData?.phone
                    ? profileData.phone
                    : formatPhoneNumber(customerInfo.phone);

            // Store customer data
            const customerData = {
                name: customerName,
                email: userEmail || undefined,
                phone: customerPhone,
                address: customerInfo.address,
                userId: userId,
            };

            if (typeof window !== 'undefined') {
                localStorage.setItem(
                    'lastOrderCustomerInfo',
                    JSON.stringify(customerData)
                );
            }

            if (isAuthenticated) {
                // Signed-in user flow: Create database order
                const result = await handlePurchaseOrder(items, total);

                if (!result.data) {
                    throw new Error(result.error || 'Failed to create order');
                }

                const orderId = result.data.id;
                const displayId =
                    (result.data as any).display_id ||
                    `BO${String(orderId).padStart(6, '0')}`;

                const orderDetailsObj = {
                    id: orderId,
                    display_id: displayId,
                    items: items.map((item) => ({
                        name: item.name,
                        grams: item.grams,
                        price: (item.pricePerKg * item.grams) / 1000,
                        unit_price: item.pricePerKg,
                    })),
                    total: total,
                    customer_name: customerName,
                    customer_phone: customerPhone,
                    delivery_address: customerInfo.address,
                    customer_email: userEmail,
                    user_id: userId,
                    created_at: new Date().toISOString(),
                };

                setOrderDetails(orderDetailsObj);

                try {
                    await sendWhatsAppOrderNotification(orderDetailsObj);
                } catch (err) {
                    console.error('Failed to send WhatsApp notification:', err);
                }

                toast.success(`Order ${displayId} created successfully!`, {
                    description: 'Admin has been notified of your order.',
                });
            } else {
                // Guest user flow: WhatsApp sharing
                const tempOrderId = `TEMP-${Date.now()}`;
                const displayId = `BO-GUEST-${Date.now().toString().slice(-6)}`;
                const formattedPhone = formatPhoneNumber(customerInfo.phone);

                const orderDetailsObj = {
                    id: tempOrderId,
                    display_id: displayId,
                    items: items.map((item) => ({
                        name: item.name,
                        grams: item.grams,
                        price: (item.pricePerKg * item.grams) / 1000,
                        unit_price: item.pricePerKg,
                    })),
                    total: total,
                    customer_name: customerInfo.name || 'Guest',
                    customer_phone: formattedPhone,
                    delivery_address: customerInfo.address,
                    created_at: new Date().toISOString(),
                };

                setOrderDetails(orderDetailsObj);
                toast.success('Order details prepared!', {
                    description: 'Please share via WhatsApp to complete your order',
                });
            }

            setIsOrderPlaced(true);
            clearCart();
        } catch (error) {
            console.error('Error processing order:', error);
            toast.error(
                error instanceof Error ? error.message : 'Failed to process order'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // Debug function
    const debugAuth = async () => {
        try {
            const { data } = await supabase.auth.getUser();
            const user = data.user;
            console.log("🔎 DEBUG - Auth check:", {
                user: user ? "exists" : "none",
                id: user?.id,
                email: user?.email
            });

            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                console.log("🔎 DEBUG - Profile:", profile);
            }

            // Force refresh our state
            if (user?.id) {
                setIsAuthenticated(true);
                setUserId(user.id);
                setUserEmail(user.email);
            }
        } catch (error) {
            console.error("🔎 DEBUG - Error:", error);
        }
    };

    // Authenticated user form
    const renderAuthenticatedForm = () => (
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
                        <span className="text-sm">Delivery Address*</span>
                    </Label>
                    <Textarea
                        id="address"
                        placeholder="Enter your delivery address"
                        value={customerInfo.address}
                        onChange={handleInfoChange('address')}
                        required
                        className="min-h-[80px] w-full resize-none"
                    />
                </div>
            </div>

            <DialogFooter className="flex items-center justify-between mt-4">
                <Button variant="outline" onClick={onCloseAction}>
                    Cancel
                </Button>
                <Button
                    onClick={handleConfirm}
                    disabled={isSubmitting || !customerInfo.address.trim()}
                    className="gap-1"
                >
                    <MessageCircle className="w-4 h-4" />
                    {isSubmitting ? 'Processing...' : 'Confirm Order'}
                </Button>
            </DialogFooter>
        </>
    );

    // Guest form
    const renderGuestForm = () => (
        <>
            <DialogHeader>
                <DialogTitle>Order Details</DialogTitle>
                <DialogDescription>
                    Review your order and provide contact details
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

            {/* Contact & Delivery Info */}
            <div className="rounded-lg border p-3 space-y-4">
                <h3 className="font-medium text-sm">Contact & Delivery Details</h3>

                <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">Your Name (optional)</span>
                    </Label>
                    <Input
                        id="name"
                        placeholder="Enter your name"
                        value={customerInfo.name}
                        onChange={handleInfoChange('name')}
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">Phone Number*</span>
                    </Label>
                    <Input
                        id="phone"
                        placeholder="e.g., 0911234567"
                        value={customerInfo.phone}
                        onChange={handleInfoChange('phone')}
                        required
                        className="w-full"
                    />
                    <p className="text-xs text-gray-500 break-words">
                        Ethiopian format: 09XXXXXXXX or +251XXXXXXXXX
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="address" className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">Delivery Address*</span>
                    </Label>
                    <Textarea
                        id="address"
                        placeholder="Enter your delivery address"
                        value={customerInfo.address}
                        onChange={handleInfoChange('address')}
                        required
                        className="min-h-[80px] w-full resize-none"
                    />
                </div>
            </div>

            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700 flex items-center gap-2 flex-wrap">
                    <Share2 className="w-4 h-4 flex-shrink-0" />
                    <span className="break-words font-medium">
                        Your order will be completed via WhatsApp
                    </span>
                </p>
                <p className="text-xs text-green-600 mt-1 pl-6">
                    After entering your details, you&apos;ll share your order with our
                    admin via WhatsApp
                </p>
            </div>

            <DialogFooter className="flex items-center justify-between mt-4">
                <Button variant="outline" onClick={onCloseAction}>
                    Cancel
                </Button>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleSignIn}
                        className="gap-1"
                        size="sm"
                    >
                        <LogIn className="w-4 h-4" />
                        Sign in
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isSubmitting || !isCustomerInfoValid()}
                        size="sm"
                        className="gap-1"
                    >
                        <Share2 className="w-4 h-4" />
                        {isSubmitting ? 'Processing...' : 'Continue to WhatsApp'}
                    </Button>
                </div>
            </DialogFooter>
        </>
    );

    // Order confirmation view
    const renderOrderPlaced = () => (
        <>
            {!isAuthenticated ? (
                // Guest order complete view
                <>
                    <DialogHeader>
                        <DialogTitle className="text-green-600 flex items-center gap-2">
                            <Share2 className="w-5 h-5" />
                            Share Your Order via WhatsApp
                        </DialogTitle>
                        <DialogDescription>
                            Your order has been prepared. Please share it via WhatsApp to
                            complete your order.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="my-4 p-4 border rounded-md bg-gray-50">
                        <h3 className="font-medium text-lg mb-2">Order Summary</h3>

                        <ScrollArea className="max-h-[150px] mb-4">
                            <div className="space-y-2">
                                {orderDetails?.items.map((item: any, index: number) => (
                                    <div key={index} className="flex justify-between text-sm">
                                        <span>
                                            {item.name} ({item.grams}g)
                                        </span>
                                        <span>ETB {item.price.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="space-y-2 mb-4">
                            <p className="text-sm">
                                <span className="font-medium">Delivery to:</span>{' '}
                                {customerInfo.address}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium">Contact:</span>{' '}
                                {customerInfo.phone}
                            </p>
                        </div>

                        <div className="text-sm font-medium flex justify-between border-t pt-2">
                            <span>Total Amount:</span>
                            <span>ETB {orderDetails?.total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            variant="default"
                            className="w-full gap-2 bg-green-600 hover:bg-green-700 py-6"
                            onClick={handleShareWhatsApp}
                            size="lg"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-5 h-5"
                            >
                                <path d="M6 12v3a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3v-6a3 3 0 0 0-3-3h-9a3 3 0 0 0-3 3v3Z" />
                                <path d="m6 12-3 3V9l3 3Z" />
                                <line x1="13" y1="12" x2="16" y2="12" />
                                <line x1="13" y1="15" x2="16" y2="15" />
                            </svg>
                            Share Order via WhatsApp
                        </Button>
                    </div>

                    <div className="text-center mt-4 flex flex-col gap-2">
                        <div className="text-xs text-muted-foreground">
                            Your order will only be processed after sharing via WhatsApp
                        </div>
                        <div className="flex justify-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onCloseAction}
                                className="text-red-500 hover:text-red-700"
                            >
                                Cancel Order
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSignIn}
                                className="gap-1"
                            >
                                <LogIn className="w-4 h-4" />
                                Sign in to track
                            </Button>
                        </div>
                    </div>
                </>
            ) : (
                // Signed-in user order complete view
                <>
                    <DialogHeader>
                        <DialogTitle className="text-green-600 flex items-center gap-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            Order Placed Successfully!
                        </DialogTitle>
                        <DialogDescription>
                            Your order has been confirmed and will be prepared for delivery.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="my-4 p-4 border rounded-md bg-gray-50">
                        <h3 className="font-medium text-lg mb-2">
                            Order #{orderDetails?.display_id}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            {new Date(orderDetails?.created_at).toLocaleString()}
                        </p>

                        <div className="space-y-2 mb-4">
                            <p className="text-sm">
                                <span className="font-medium">Delivery Address:</span>{' '}
                                {customerInfo.address}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium">Contact:</span>{' '}
                                {customerInfo.phone}
                            </p>
                        </div>

                        <div className="text-sm font-medium flex justify-between border-t pt-2">
                            <span>Total Amount:</span>
                            <span>ETB {orderDetails?.total.toFixed(2)}</span>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={onCloseAction}>Close</Button>
                    </DialogFooter>
                </>
            )}
        </>
    );

    // Render appropriate content based on auth and order state
    const renderContent = () => {
        console.log("🖥️ Rendering content:", {
            isLoading,
            isAuthenticated,
            isOrderPlaced
        });

        if (isLoading) {
            return <LoadingSpinner />;
        }

        if (isOrderPlaced) {
            return renderOrderPlaced();
        }

        return isAuthenticated ? renderAuthenticatedForm() : renderGuestForm();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onCloseAction}>
            <DialogContent className="sm:max-w-md md:max-w-lg">
                {/* Debug button */}
                {process.env.NODE_ENV !== 'production' && (
                    <div className="absolute top-0 right-0 z-50 opacity-30 hover:opacity-100">
                        <button
                            onClick={debugAuth}
                            className="text-xs p-1 bg-gray-200 rounded"
                            type="button"
                        >
                            Debug
                        </button>
                    </div>
                )}

                {/* Auth status indicator */}
                {process.env.NODE_ENV !== 'production' && (
                    <div className="absolute top-0 left-0 z-50 opacity-30 hover:opacity-100">
                        <div className="text-xs p-1 rounded bg-opacity-80"
                            style={{ backgroundColor: isAuthenticated ? '#bef5c8' : '#fed7d7' }}>
                            {isAuthenticated ? "Authenticated" : "Guest"}
                        </div>
                    </div>
                )}

                {renderContent()}
            </DialogContent>
        </Dialog>
    );
};
