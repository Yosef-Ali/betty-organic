"use client";

import React from "react";
import { useState, useEffect, useCallback } from "react"; // Added useCallback
// Removed: import { createClient } from '@/lib/supabase/client';
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getSession, getUser } from "@/app/actions/auth"; // Import server actions
import { getProfile } from "@/app/actions/profile"; // Import server action
import type { Session, User } from '@supabase/supabase-js'; // Import types;
import { CartItemType } from "@/types/cart";
import { useMarketingCartStore } from "@/store/cartStore";
import { sendWhatsAppOrderNotification } from "@/app/(marketing)/actions/notificationActions";
import { handlePurchaseOrder } from "@/app/actions/purchaseActions";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { updateUserProfile } from "@/app/actions/profile"; // Import profile update action

import { LoadingSpinner } from "./LoadingSpinner";
import { AuthenticatedForm } from "./AuthenticatedForm";
import { GuestForm } from "./GuestForm";
import OrderPlaced from "./OrderPlaced";

import { CustomerInfo, ConfirmPurchaseDialogProps, OrderDetails, AuthenticatedFormProps } from "./types";
import { formatPhoneNumber, saveCartToLocalStorage, validateCustomerInfo } from "./utils";
import { ProfileUpdateForm } from "./ProfileUpdateForm";

export const ConfirmPurchaseDialog: React.FC<ConfirmPurchaseDialogProps> = ({
    isOpen,
    onCloseAction,
    items,
    total,
}: ConfirmPurchaseDialogProps): React.ReactElement => {
    // Auth states
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [profileData, setProfileData] = useState<any | null>(null);

    // UI states
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOrderPlaced, setIsOrderPlaced] = useState(false);
    const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
    const [needsProfileUpdate, setNeedsProfileUpdate] = useState(false); // Add state for profile update needed

    // Customer info
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
        name: "",
        phone: "",
        address: "",
    });

    const clearCart = useMarketingCartStore((state) => state.clearCart);
    const router = useRouter();
    // Removed: const supabase = createClient();

    // Fetch auth state using server actions
    const fetchAuthState = useCallback(async () => {
        console.log("🔄 [AUTH_FLOW] Starting fetchAuthState...");
        setIsLoading(true); // Ensure loading starts
        let finalIsAuthenticated = false; // Track final state
        let finalUserId: string | null = null;
        let finalUserEmail: string | null = null;
        let finalProfileData: any | null = null;

        try {
            console.log("🔄 [AUTH_FLOW] Calling getSession()...");
            const session = await getSession(); // Use server action
            const user = session?.user; // Get user from session if available

            console.log("🔐 [AUTH_FLOW] getSession result:", { sessionExists: !!session, userId: user?.id, userEmail: user?.email });

            if (user) {
                console.log("✅ [AUTH_FLOW] User found in session.");
                finalIsAuthenticated = true;
                finalUserId = user.id;
                finalUserEmail = user.email || null;


                // Fetch profile using server action
                console.log(`🔄 [AUTH_FLOW] Calling getProfile(${user.id})...`);
                const profile = await getProfile(user.id);
                console.log("👤 [AUTH_FLOW] getProfile result:", profile);
                finalProfileData = profile; // Store profile data or null

                if (profile) {
                    console.log("✅ [AUTH_FLOW] Profile found.");
                    setCustomerInfo({ // Set customer info based on profile
                        name: profile.name || (user.email?.split('@')[0] || ''),
                        phone: profile.phone || '',
                        address: profile.address || ''
                    });
                } else {
                    console.log("⚠️ [AUTH_FLOW] No profile found for authenticated user.");
                    // Set customer info based on user email if no profile
                    setCustomerInfo(prev => ({
                        ...prev,
                        name: user.email?.split('@')[0] || '',
                        phone: '', // Clear previous guest/profile data
                        address: '' // Clear previous guest/profile data
                    }));
                }
            } else {
                console.log("❌ [AUTH_FLOW] No user found in session. Setting guest state.");
                finalIsAuthenticated = false;
                finalUserId = null;
                finalUserEmail = null;
                finalProfileData = null;
                setCustomerInfo({ name: "", phone: "", address: "" }); // Reset for guest
            }
        } catch (error) {
            console.error("❌ [AUTH_FLOW] Error during fetchAuthState:", error);
            toast.error("Failed to load user session. Please try again.");
            finalIsAuthenticated = false; // Assume guest on error
            finalUserId = null;
            finalUserEmail = null;
            finalProfileData = null;
        } finally {
            // Set all states together at the end
            console.log("🔄 [AUTH_FLOW] Setting final states:", { finalIsAuthenticated, finalUserId, finalUserEmail, finalProfileData: !!finalProfileData });
            setIsAuthenticated(finalIsAuthenticated);
            setUserId(finalUserId);
            setUserEmail(finalUserEmail);
            setProfileData(finalProfileData);
            setIsLoading(false); // Ensure loading stops
            console.log("✅ [AUTH_FLOW] fetchAuthState complete.");
        }
    }, []); // useCallback dependencies

    useEffect(() => {
        // Only fetch if the dialog is open to avoid unnecessary calls
        if (isOpen) {
            fetchAuthState();
        }
        // Note: We no longer use onAuthStateChange here.
        // Real-time updates might require a different approach like polling,
        // server-sent events, or triggering refetch on specific actions (e.g., after login/logout).
        // For now, this fetches state on component mount/dialog open.
    }, [fetchAuthState, isOpen]); // Re-fetch when dialog opens

    const handleSignIn = () => {
        saveCartToLocalStorage(items, customerInfo);
        router.push('/auth/login?returnTo=/');
    };

    const handleShareWhatsApp = () => {
        if (!orderDetails) return;
        sendWhatsAppOrderNotification(orderDetails)
            .then(() => toast.success('WhatsApp notification ready!'))
            .catch((err) => {
                const formattedError = typeof err === 'object' ? JSON.stringify(err, null, 2) : String(err);
                console.error('Failed to prepare WhatsApp notification:', formattedError);
                toast.error('Failed to prepare WhatsApp message.');
            });
    };    // Simplified function to handle just the delivery address input
    const handleProfileUpdate = async (updatedInfo: { address: string }) => {
        try {
            setIsSubmitting(true);
            console.log("📝 [ORDER_ADDRESS] Using delivery address:", updatedInfo.address);

            // Update customer info with the address
            setCustomerInfo(prev => ({
                ...prev,
                address: updatedInfo.address
            }));

            // Return to normal order flow and proceed with order
            setNeedsProfileUpdate(false);

            // Continue with order placement automatically
            await handleConfirmWithAddress(updatedInfo.address);

        } catch (error) {
            console.error("Failed to update profile:", error);
            toast.error("Failed to update profile. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isCustomerInfoValid = () =>
        validateCustomerInfo(!!isAuthenticated, customerInfo);

    // New function to handle order confirmation with just the address
    const handleConfirmWithAddress = async (deliveryAddress: string) => {
        try {
            if (!items.length) {
                throw new Error('No items in cart');
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

            if (isAuthenticated) {
                // Signed-in user flow: Create database order directly without profile update
                const orderItems = items.map(item => ({
                    id: item.id,
                    name: item.name,
                    pricePerKg: item.pricePerKg,
                    grams: item.grams,
                }));

                const result = await handlePurchaseOrder(orderItems, total);

                if (result.error && !result.error.includes("profile")) {
                    throw new Error(result.error || 'Failed to create order');
                }

                if (!result.data) {
                    throw new Error('Order data is missing');
                }

                const orderId = result.data.id;
                const displayId =
                    (result.data as any).display_id ||
                    `BO${String(orderId).padStart(6, '0')}`;

                const orderDetailsObj: OrderDetails = {
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
                    delivery_address: deliveryAddress,
                    customer_email: userEmail,
                    user_id: userId,
                    created_at: new Date().toISOString(),
                };

                setOrderDetails(orderDetailsObj);

                try {
                    await sendWhatsAppOrderNotification(orderDetailsObj);
                } catch (err) {
                    // This is a non-critical error, so just log it
                    const formattedError = typeof err === 'object' ? JSON.stringify(err, null, 2) : String(err);
                    console.error('Failed to send WhatsApp notification:', formattedError);
                }

                toast.success(`Order ${displayId} created successfully!`, {
                    description: 'Admin has been notified of your order.',
                });
            } else {
                // Guest user flow
                const tempOrderId = `TEMP-${Date.now()}`;
                const displayId = `BO-GUEST-${Date.now().toString().slice(-6)}`;
                const formattedPhone = formatPhoneNumber(customerInfo.phone);

                const orderDetailsObj: OrderDetails = {
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
                    delivery_address: deliveryAddress,
                    created_at: new Date().toISOString(),
                };

                setOrderDetails(orderDetailsObj);
                toast.success('Order details prepared!', {
                    description: 'Please share via WhatsApp to complete your order',
                });
            }

            setIsOrderPlaced(true);
            clearCart();

            // Auto-close the dialog after a delay to return to the marketing page
            setTimeout(() => {
                onCloseAction(); // Close the dialog automatically after showing confirmation
            }, 15000); // 15 seconds delay to allow user to see confirmation and take action
        } catch (error) {
            let userFriendlyMessage: string;

            if (error instanceof Error) {
                userFriendlyMessage = error.message;
                console.error(`Error processing order: ${error.message}`, error.stack);
            } else {
                const formattedError = typeof error === 'object' && error !== null
                    ? JSON.stringify(error, null, 2)
                    : String(error);
                console.error('Unknown error processing order:', formattedError);
                userFriendlyMessage = 'An unexpected error occurred. Please try again.';
            }

            toast.error(userFriendlyMessage);
        } finally {
            setIsSubmitting(false);
        }
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

                if (result.error) {
                    // Check if the error is about incomplete profile
                    if (result.error.includes("profile")) {
                        console.log("🚨 [ORDER_FLOW] Profile information is incomplete, showing update form");
                        setNeedsProfileUpdate(true);
                        return; // Exit early to show the profile update form
                    } else {
                        throw new Error(result.error || 'Failed to create order');
                    }
                }

                if (!result.data) {
                    throw new Error('Order data is missing');
                }

                const orderId = result.data.id;
                const displayId =
                    (result.data as any).display_id ||
                    `BO${String(orderId).padStart(6, '0')}`;

                const orderDetailsObj: OrderDetails = {
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
                    // This is a non-critical error, so just log it
                    const formattedError = typeof err === 'object' ? JSON.stringify(err, null, 2) : String(err);
                    console.error('Failed to send WhatsApp notification:', formattedError);
                    // No toast here to avoid confusing the user about the order status
                }

                toast.success(`Order ${displayId} created successfully!`, {
                    description: 'Admin has been notified of your order.',
                });
            } else {
                // Guest user flow remains unchanged
                const tempOrderId = `TEMP-${Date.now()}`;
                const displayId = `BO-GUEST-${Date.now().toString().slice(-6)}`;
                const formattedPhone = formatPhoneNumber(customerInfo.phone);

                const orderDetailsObj: OrderDetails = {
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
            // More targeted error handling
            let userFriendlyMessage: string;

            if (error instanceof Error) {
                // For known errors with specific messages
                userFriendlyMessage = error.message;

                // Log detailed error for debugging
                console.error(`Error processing order: ${error.message}`, error.stack);
            } else {
                // For unknown error types
                const formattedError = typeof error === 'object' && error !== null
                    ? JSON.stringify(error, null, 2)
                    : String(error);

                console.error('Unknown error processing order:', formattedError);
                userFriendlyMessage = 'An unexpected error occurred. Please try again.';
            }

            // Show toast with user-friendly message
            toast.error(userFriendlyMessage, {
                description: isAuthenticated
                    ? "If this persists, please try updating your profile information."
                    : "Please check your information and try again."
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Removed debugAuth function as it relied on client-side Supabase

    // Render appropriate content based on auth and order state
    const renderContent = () => {

        if (isLoading) {
            return <LoadingSpinner />;
        } if (isOrderPlaced && orderDetails) {
            // Use JSX directly instead of React.createElement with updated Action suffix props
            return (
                <OrderPlaced
                    isAuthenticated={!!isAuthenticated}
                    orderDetails={orderDetails}
                    customerInfo={customerInfo}
                    handleShareWhatsAppAction={handleShareWhatsApp}
                    handleSignInAction={handleSignIn}
                    onCloseAction={onCloseAction}
                />
            );
        }

        if (needsProfileUpdate) {
            return (
                <ProfileUpdateForm
                    existingData={customerInfo}
                    onSubmit={handleProfileUpdate}
                    onCancel={() => setNeedsProfileUpdate(false)}
                    isSubmitting={isSubmitting}
                    userEmail={userEmail}
                />
            );
        }

        if (isAuthenticated) {
            return (
                <AuthenticatedForm
                    items={items}
                    total={total}
                    customerInfo={customerInfo}
                    setCustomerInfoAction={setCustomerInfo}
                    isSubmitting={isSubmitting}
                    handleConfirmAction={handleConfirm}
                    onCancelAction={onCloseAction}
                    isCustomerInfoValidAction={isCustomerInfoValid}
                    profileData={profileData}
                    userEmail={userEmail}
                />
            );
        }

        return (
            <GuestForm
                items={items}
                total={total}
                customerInfo={customerInfo}
                setCustomerInfo={setCustomerInfo}
                isSubmitting={isSubmitting}
                handleConfirm={handleConfirm}
                handleSignIn={handleSignIn}
                onCancel={onCloseAction}
                isCustomerInfoValid={isCustomerInfoValid}
            />
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onCloseAction}>
            <DialogContent className="sm:max-w-md md:max-w-lg">
                <VisuallyHidden>
                    <DialogTitle>Confirm Purchase</DialogTitle>
                </VisuallyHidden>
                {/* Removed Debug button */}

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
