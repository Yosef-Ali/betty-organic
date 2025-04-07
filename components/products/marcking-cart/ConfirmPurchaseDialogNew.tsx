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
import { useAuth } from "@/components/providers/AuthProvider";
import { Profile } from "@/lib/types/auth";

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

// Auth-based component types
type AuthState = "loading" | "authenticated" | "guest";

// Loading state component
const AuthLoadingContent = () => (
  <div className="py-8 flex flex-col items-center justify-center gap-3">
    <Loader className="w-6 h-6 animate-spin text-primary" />
    <p className="text-sm text-muted-foreground">
      Checking authentication status...
    </p>
  </div>
);

export const ConfirmPurchaseDialogNew = ({
  isOpen,
  onCloseAction,
  items,
  total,
}: ConfirmPurchaseDialogProps) => {
  // Flow state
  type DialogFlowState = "initial" | "reviewAndDetails" | "orderPlaced";
  // Start with reviewAndDetails for authenticated users, initial for guests
  const [flowState, setFlowState] = useState<DialogFlowState>("initial");

  // Auth state machine with explicit loading state
  const [authState, setAuthState] = useState<AuthState>("loading");
  const { user, profile, isLoading: authIsLoading } = useAuth();

  // Force auth check immediately on component mount
  useEffect(() => {
    const immediateAuthCheck = async () => {
      console.log("[Immediate Auth Check] Starting immediate auth check on component mount");
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        // Direct Supabase call to check auth status
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();

        console.log("[Immediate Auth Check] Direct result:", {
          authenticated: !!supabaseUser,
          userId: supabaseUser?.id,
          email: supabaseUser?.email
        });

        if (supabaseUser?.id) {
          console.log("[Immediate Auth Check] User is authenticated!");
          setAuthState("authenticated");
          setFlowState("reviewAndDetails");

          // Also try to get profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', supabaseUser.id)
            .single();

          if (profileData) {
            console.log("[Immediate Auth Check] Got profile:", profileData);
            setCustomerInfo({
              name: profileData.name || supabaseUser.email?.split("@")[0] || "",
              phone: profileData.phone || "",
              address: profileData.address || ""
            });
          }
        } else {
          console.log("[Immediate Auth Check] User is not authenticated");
          setAuthState("guest");
        }
      } catch (error) {
        console.error("[Immediate Auth Check] Error:", error);
        // Fall back to guest mode on error
        setAuthState("guest");
      }
    };

    immediateAuthCheck();
  }, []);  // Run only once on mount

  // Add profile loading state
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // Track when auth is fully checked with enhanced debug logging
  useEffect(() => {
    console.log("[Auth Debug] Auth loading state changed:", {
      authIsLoading,
      userExists: !!user?.id,
      profileExists: !!profile,
      profileData: profile ? { phone: profile.phone, name: profile.name } : null
    });

    if (!authIsLoading) {
      // Set auth state based on user existence
      const newAuthState = user?.id ? "authenticated" : "guest";
      console.log("[Auth Debug] Setting auth state to:", newAuthState, {
        userId: user?.id,
        userEmail: user?.email,
        profilePhone: profile?.phone
      });
      setAuthState(newAuthState);

      // If dialog is already open, update flow state immediately
      if (isOpen) {
        if (newAuthState === "guest") {
          console.log(
            "[Auth Debug] Dialog already open - setting flow state to initial for guest"
          );
          setFlowState("initial");
        } else if (newAuthState === "authenticated") {
          console.log(
            "[Auth Debug] Dialog already open - setting flow state to reviewAndDetails for authenticated user"
          );
          setFlowState("reviewAndDetails");
        }
      }
    }
  }, [authIsLoading, user?.id, isOpen, profile]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    phone: "",
    address: "",
  });
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const clearCart = useMarketingCartStore((state) => state.clearCart);
  const router = useRouter();

  // Force auth check when dialog opens
  useEffect(() => {
    if (isOpen) {
      console.log("[Dialog Open] Dialog opened, checking auth state...");

      // Force immediate check of user authentication
      const checkAuth = async () => {
        console.log("[Auth Refresh] Current auth state:", {
          authState,
          userId: user?.id,
          userEmail: user?.email,
          isAuthLoading: authIsLoading,
          hasProfile: !!profile
        });

        // If we have a user ID but auth state doesn't match, force correction
        if (user?.id && authState !== "authenticated") {
          console.log("[Auth Refresh] User ID detected but auth state incorrect, forcing update");
          setAuthState("authenticated");
          setFlowState("reviewAndDetails");
        }

        // If auth state is loading for too long, check directly
        if (authState === "loading" && !authIsLoading) {
          console.log("[Auth Refresh] Resolving stuck loading state");
          const newAuthState = user?.id ? "authenticated" : "guest";
          console.log("[Auth Refresh] Setting auth state directly to:", newAuthState);
          setAuthState(newAuthState);
          setFlowState(newAuthState === "authenticated" ? "reviewAndDetails" : "initial");
        }

        // Only show the initial screen for guest users
        // For authenticated users, go directly to reviewAndDetails
        if (authState === "guest") {
          console.log("[Dialog Open] Setting flow state to initial for guest user");
          setFlowState("initial");
        } else if (authState === "authenticated") {
          console.log(
            "[Dialog Open] Setting flow state to reviewAndDetails for authenticated user"
          );
          setFlowState("reviewAndDetails");
        } else {
          console.log("[Dialog Open] Auth state is still loading, not changing flow state yet");
        }
      };

      checkAuth();
    }
  }, [isOpen, authState, user?.id, authIsLoading, profile]);

  // Manual direct check for user authentication status - higher priority than state machine
  useEffect(() => {
    // Direct check of user ID takes precedence over auth state machine
    if (user?.id) {
      console.log("[Auth Direct Check] User ID detected:", user.id);

      if (authState !== "authenticated") {
        console.log("[Auth Direct Check] Correcting auth state to authenticated");
        setAuthState("authenticated");
      }

      if (isOpen && flowState !== "reviewAndDetails" && flowState !== "orderPlaced") {
        console.log("[Auth Direct Check] Correcting flow state to reviewAndDetails");
        setFlowState("reviewAndDetails");
      }
    } else if (!authIsLoading && authState !== "guest") {
      console.log("[Auth Direct Check] No user ID and not loading, setting guest state");
      setAuthState("guest");

      if (isOpen && flowState !== "initial" && flowState !== "orderPlaced") {
        setFlowState("initial");
      }
    }
  }, [user?.id, authState, flowState, isOpen, authIsLoading]);

  // Ensure flow state is synchronized with auth state
  useEffect(() => {
    if (authState === "authenticated" && flowState !== "orderPlaced") {
      console.log("[Flow Sync] Auth state is authenticated, updating flow state to reviewAndDetails");
      setFlowState("reviewAndDetails");
    } else if (authState === "guest" && flowState !== "orderPlaced") {
      console.log("[Flow Sync] Auth state is guest, updating flow state to initial");
      setFlowState("initial");
    }
  }, [authState, flowState]);

  // Enhanced profile sync with retry logic
  useEffect(() => {
    const syncProfile = async () => {
      if (authState === "authenticated") {
        console.log("[Profile Sync] Starting profile synchronization");
        try {
          setIsProfileLoading(true);

          // Add retry logic for profile data
          let attempts = 0;
          const maxAttempts = 3;

          while (attempts < maxAttempts) {
            if (profile) {
              console.log("[Profile Sync] Profile data available:", {
                name: profile.name,
                phone: profile.phone,
                address: profile.address
              });

              setCustomerInfo(prevInfo => ({
                ...prevInfo,
                name: profile.name || user?.email?.split("@")[0] || "",
                phone: profile.phone || "",
                // Only update address if it's not already set by user
                ...(prevInfo.address === "" ? { address: profile.address || "" } : {})
              }));

              break;
            }

            attempts++;
            console.log(`[Profile Sync] Waiting for profile data (attempt ${attempts}/${maxAttempts})`);

            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }

          if (attempts === maxAttempts && !profile) {
            console.warn("[Profile Sync] Failed to get profile data after multiple attempts");
            // Still set name from email as fallback
            if (user?.email) {
              setCustomerInfo(prevInfo => ({
                ...prevInfo,
                name: user.email?.split("@")[0] || ""
              }));
            }
          }
        } finally {
          setIsProfileLoading(false);
        }
      }
    };

    syncProfile();
  }, [authState, profile, user?.email, user?.id]);

  // Form handlers
  const handleInfoChange =
    (field: keyof CustomerInfo) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setCustomerInfo((prev) => ({
          ...prev,
          [field]: e.target.value,
        }));
      };

  const isCustomerInfoValid = () => {
    if (authState === "authenticated") {
      // For authenticated users, only delivery address is required
      return customerInfo.address.trim().length > 0;
    } else {
      // For guests, both phone and address are required
      return (
        customerInfo.phone.length >= 9 && customerInfo.address.trim().length > 0
      );
    }
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("251")) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith("0")) {
      return `+251${cleaned.slice(1)}`;
    }
    return `+251${cleaned}`;
  };

  const handleSignIn = () => {
    localStorage.setItem(
      "pendingCart",
      JSON.stringify({
        items,
        customerInfo,
        timestamp: Date.now(),
      })
    );
    router.push("/auth/login?returnTo=/");
  };

  const handleShareWhatsApp = () => {
    if (!orderDetails) return;
    sendWhatsAppOrderNotification(orderDetails)
      .then(() => toast.success("WhatsApp notification ready!"))
      .catch((err: Error) => {
        console.error("Failed to prepare WhatsApp notification:", err.message);
        toast.error("Failed to prepare WhatsApp message.");
      });
  };

  const handleConfirm = async () => {
    try {
      console.log("Confirming order with state:", { authState, customerInfo });
      setIsSubmitting(true);

      if (!items.length) {
        throw new Error("No items in cart");
      }

      if (!isCustomerInfoValid()) {
        throw new Error(
          authState === "authenticated"
            ? "Please provide a delivery address"
            : "Please provide valid contact information"
        );
      }

      // Prepare customer data
      const customerName =
        authState === "authenticated"
          ? profile?.name || user?.email?.split("@")[0] || "Customer"
          : customerInfo.name || "Guest";

      const customerPhone =
        authState === "authenticated" && profile?.phone
          ? profile.phone
          : formatPhoneNumber(customerInfo.phone);

      // Store customer data
      const customerData = {
        name: customerName,
        email: user?.email || undefined,
        phone: customerPhone,
        address: customerInfo.address,
        userId: user?.id,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem(
          "lastOrderCustomerInfo",
          JSON.stringify(customerData)
        );
      }

      if (authState === "authenticated") {
        // Signed-in user flow: Create database order
        const result = await handlePurchaseOrder(items, total);

        if (!result.data) {
          throw new Error(result.error || "Failed to create order");
        }

        const orderId = result.data.id;
        const displayId =
          (result.data as any).display_id ||
          `BO${String(orderId).padStart(6, "0")}`;

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
          customer_email: user?.email,
          user_id: user?.id,
          created_at: new Date().toISOString(),
        };

        setOrderDetails(orderDetailsObj);

        try {
          await sendWhatsAppOrderNotification(orderDetailsObj);
        } catch (err) {
          console.error("Failed to send WhatsApp notification:", err);
        }

        toast.success(`Order ${displayId} created successfully!`, {
          description: "Admin has been notified of your order.",
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
          customer_name: customerInfo.name || "Guest",
          customer_phone: formattedPhone,
          delivery_address: customerInfo.address,
          created_at: new Date().toISOString(),
        };

        setOrderDetails(orderDetailsObj);
        toast.success("Order details prepared!", {
          description: "Please share via WhatsApp to complete your order",
        });
      }

      setFlowState("orderPlaced");
      clearCart();
    } catch (error) {
      console.error("Error processing order:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to process order"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enhanced debug function with direct auth check
  const debugCheckAuth = async () => {
    console.log("[Manual Auth Debug] Current state:", {
      userObject: user,
      userId: user?.id,
      userEmail: user?.email,
      authState: authState,
      flowState: flowState,
      profileExists: !!profile,
      profileData: profile,
      authLoading: authIsLoading,
      profileLoading: isProfileLoading,
      dialogOpen: isOpen
    });

    // Try a direct check with Supabase
    try {
      console.log("[Auth Force Check] Directly checking auth status with Supabase...");
      // Import the client dynamically to avoid server-side issues
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      // Force refresh auth state
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();

      console.log("[Auth Force Check] Direct Supabase auth result:", {
        isAuthenticated: !!supabaseUser,
        userId: supabaseUser?.id,
        email: supabaseUser?.email
      });

      // Directly set auth state based on this check
      if (supabaseUser?.id) {
        console.log("[Auth Force Check] User IS authenticated, correcting state");
        setAuthState("authenticated");
        if (flowState !== "orderPlaced") {
          setFlowState("reviewAndDetails");
        }

        // Try to get profile directly
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();

        if (profileData) {
          console.log("[Auth Force Check] Got profile data:", profileData);
          setCustomerInfo(prevInfo => ({
            ...prevInfo,
            name: profileData.name || supabaseUser.email?.split("@")[0] || "",
            phone: profileData.phone || "",
            address: profileData.address || prevInfo.address || ""
          }));
        }
      } else {
        console.log("[Auth Force Check] User is NOT authenticated");
        setAuthState("guest");
      }
    } catch (error) {
      console.error("[Auth Force Check] Error checking auth:", error);
    }
  };

  // Force check auth status when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Run the normal debug check
      debugCheckAuth();

      // Set a timer to force check if still in loading state after some time
      const timer = setTimeout(() => {
        if (authState === "loading") {
          console.log("[Auth Timeout] Still in loading state after timeout, forcing direct check");
          debugCheckAuth();
        }
      }, 500); // Check after 500ms if still loading

      return () => clearTimeout(timer);
    }
  }, [isOpen, authState]);

  // Main render function with enhanced logging
  console.log("[Auth Debug] Current render state:", {
    authState,
    flowState,
    isOpen,
    isAuthenticated: !!user?.id,
    userId: user?.id,
    isProfileLoading,
    profile: profile ? { exists: true, hasPhone: !!profile.phone } : null,
    customerInfo
  });

  // Render based on authentication state and flow state
  const renderDialogContent = () => {
    // Show loading state while checking auth
    if (authState === "loading") {
      return <AuthLoadingContent />;
    }

    // Show profile loading state
    if (authState === "authenticated" && isProfileLoading) {
      return (
        <div className="py-8 flex flex-col items-center justify-center gap-3">
          <Loader className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading your profile data...
          </p>
        </div>
      );
    }

    // For completed orders, show the order confirmation
    if (flowState === "orderPlaced") {
      return renderOrderPlaced();
    }

    // For authenticated users in reviewAndDetails state, show simplified form
    if (authState === "authenticated" && flowState === "reviewAndDetails") {
      return renderAuthenticatedForm();
    }

    // For guests in initial state, show the full form
    if (authState === "guest" && flowState === "initial") {
      return renderGuestForm();
    }

    // For guests in reviewAndDetails state, show the full form
    if (authState === "guest" && flowState === "reviewAndDetails") {
      return renderGuestForm();
    }

    // Default fallback - should not reach here if state transitions are correct
    console.log("Unexpected state combination:", { authState, flowState });
    return <AuthLoadingContent />;
  };

  // Simplified form for authenticated users
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
              {profile?.name || user?.email?.split("@")[0]}
            </span>
          </div>
          {profile?.phone && (
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-sm">{profile.phone}</span>
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
            onChange={handleInfoChange("address")}
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
          {isSubmitting ? "Processing..." : "Confirm Order"}
        </Button>
      </DialogFooter>
    </>
  );

  // Full form for guest users
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
            onChange={handleInfoChange("name")}
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
            onChange={handleInfoChange("phone")}
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
            onChange={handleInfoChange("address")}
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
            {isSubmitting ? "Processing..." : "Continue to WhatsApp"}
          </Button>
        </div>
      </DialogFooter>
    </>
  );

  // Shared order placed view with conditional rendering based on auth state
  const renderOrderPlaced = () => (
    <>
      {authState === "guest" ? (
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
                <span className="font-medium">Delivery to:</span>{" "}
                {customerInfo.address}
              </p>
              <p className="text-sm">
                <span className="font-medium">Contact:</span>{" "}
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
                <span className="font-medium">Delivery Address:</span>{" "}
                {customerInfo.address}
              </p>
              <p className="text-sm">
                <span className="font-medium">Contact:</span>{" "}
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

  // Main render with comprehensive debug info
  console.log("[Auth Debug] Dialog rendering with states:", {
    authState,
    flowState,
    isOpen,
    directAuthCheck: !!user?.id,
    userId: user?.id,
    userEmail: user?.email,
    isProfileLoading,
    profilePhone: profile?.phone,
    customerInfo: customerInfo,
    customerInfoSet: !!customerInfo.name || !!customerInfo.phone
  });

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        {/* Add hidden debug button in development */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="absolute top-0 right-0 z-50 opacity-30 hover:opacity-100">
            <button
              onClick={debugCheckAuth}
              className="text-xs p-1 bg-gray-200 rounded"
              type="button"
            >
              Debug
            </button>
          </div>
        )}
        {renderDialogContent()}
      </DialogContent>
    </Dialog>
  );
};
