import { FC, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SalesCartItem } from "@/store/salesCartStore";
import {
  Printer,
  Lock,
  Unlock,
  Share2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { getCustomerList } from "@/app/actions/customerActions";
import { toast } from "sonner";

interface OrderSummaryProps {
  // Guest flow properties
  isGuestFlow?: boolean;
  guestName?: string;
  setGuestName?: (name: string) => void;
  guestLocation?: string;
  setGuestLocation?: (location: string) => void;
  guestPhone?: string; // Ensure this is present
  setGuestPhone?: (phone: string) => void; // Ensure this is present
  onGuestOrderConfirm?: () => void;

  // Existing properties
  items: Array<{
    id: string;
    name: string;
    grams: number;
    pricePerKg: number;
    imageUrl: string;
  }>;
  totalAmount: number;
  customerId: string;
  setCustomerId: (id: string) => void;
  orderStatus: string;
  setOrderStatus: (status: string) => void;
  handleToggleLock: () => void;
  handleConfirmDialog: (
    action: "save" | "cancel",
    selectedCustomer: any
  ) => void;
  isSaving?: boolean; // Made optional
  onPrintPreview: () => void;
  isOrderSaved?: boolean; // Made optional
  orderNumber?: string;
  deliveryCost?: number; // Added delivery cost
  setDeliveryCost?: (cost: number) => void; // Added setter for delivery cost
  customerInfo?: {
    id?: string;
    name?: string;
    email?: string;
  };
  setCustomerInfo?: (info: {
    id?: string;
    name?: string;
    email?: string;
  }) => void;
  isAdmin?: boolean; // Made optional
  disabled?: boolean;
  profile?: {
    id: string;
    role: string;
    name: string | null;
    email?: string;
  };
}

interface CustomerType {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export const OrderSummary: FC<OrderSummaryProps> = ({
  // Core props
  items,
  totalAmount,
  customerId,
  setCustomerId,
  orderStatus,
  setOrderStatus,
  handleToggleLock,
  handleConfirmDialog,
  isSaving = false, // Default value
  onPrintPreview,
  isOrderSaved = false, // Default value
  orderNumber,
  isAdmin = false, // Default value
  customerInfo,
  setCustomerInfo,
  profile,
  deliveryCost = 500, // Default delivery cost
  setDeliveryCost,

  // Guest flow props with defaults
  isGuestFlow = false,
  guestName = "",
  setGuestName = () => {},
  guestLocation = "",
  setGuestLocation = () => {},
  guestPhone = "", // Default value
  setGuestPhone = () => {}, // Default value
  onGuestOrderConfirm = () => {
    console.warn("onGuestOrderConfirm not provided");
  },
}) => {
  // Validation constants
  const MIN_NAME_LENGTH = 3;
  const MAX_NAME_LENGTH = 50;
  const MIN_LOCATION_LENGTH = 5;
  const MAX_LOCATION_LENGTH = 100;

  // Validation functions
  const validatePhone = (phone: string) => {
    if (!phone) return "Phone number is required";
    if (!/^\+251\d{9}$/.test(phone)) {
      return "Please enter a valid Ethiopian phone number (+251xxxxxxxxx)";
    }
    return null;
  };

  const validateGuestName = (name: string) => {
    if (!name || name.length < MIN_NAME_LENGTH) {
      return `Name must be at least ${MIN_NAME_LENGTH} characters`;
    }
    if (name.length > MAX_NAME_LENGTH) {
      return `Name must be less than ${MAX_NAME_LENGTH} characters`;
    }
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      return "Name should only contain letters and spaces";
    }
    return null;
  };

  const validateGuestLocation = (location: string) => {
    if (!location || location.length < MIN_LOCATION_LENGTH) {
      return `Location must be at least ${MIN_LOCATION_LENGTH} characters`;
    }
    if (location.length > MAX_LOCATION_LENGTH) {
      return `Location must be less than ${MAX_LOCATION_LENGTH} characters`;
    }
    return null;
  };

  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [customerList, setCustomerList] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerType | null>(
    null
  );

  // Memoized date formatting function
  const getFormattedDate = useCallback((date: Date = new Date()) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  // Log component props when it loads
  useEffect(() => {
    console.log("OrderSummary props:", {
      items,
      totalAmount,
      customerId,
      orderStatus,
      isAdmin,
      profile,
      isGuestFlow,
      deliveryCost,
      hasSetDeliveryCost: !!setDeliveryCost,
    });
  }, [
    items,
    totalAmount,
    customerId,
    orderStatus,
    isAdmin,
    profile,
    isGuestFlow,
    deliveryCost,
    setDeliveryCost,
  ]);

  // Effect for fetching customers - runs only once
  useEffect(() => {
    let isMounted = true;
    const fetchCustomers = async () => {
      try {
        const customers = await getCustomerList();
        if (isMounted) setCustomerList(customers);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };
    fetchCustomers();
    return () => {
      isMounted = false;
    };
  }, []);

  // Separate effect for updating selected customer when customerInfo changes
  useEffect(() => {
    if (customerInfo?.id && customerList.length > 0) {
      const matchingCustomer = customerList.find(
        (c) => c.id === customerInfo.id
      );
      if (
        matchingCustomer &&
        (!selectedCustomer || selectedCustomer.id !== matchingCustomer.id)
      ) {
        setSelectedCustomer(matchingCustomer);
      }
    }
  }, [customerInfo?.id, customerList, selectedCustomer]);

  // Effect for setting customer details when selectedCustomer changes
  useEffect(() => {
    if (selectedCustomer) {
      setCustomerDetails((prev) => ({
        ...prev,
        name: selectedCustomer.name || prev.name,
        email: selectedCustomer.email || prev.email,
        phone: selectedCustomer.phone || prev.phone,
        address: selectedCustomer.address || prev.address,
      }));
    }
  }, [selectedCustomer]);

  const handleOrderStatusChange = useCallback(
    (status: string) => {
      if (status !== orderStatus) setOrderStatus(status);
    },
    [orderStatus, setOrderStatus]
  );

  const handleCustomerChange = useCallback(
    (value: string) => {
      const selected = customerList.find((c) => c.id === value);
      if (selected) {
        const customerData = { id: selected.id, name: selected.name };
        setSelectedCustomer(selected);
        setCustomerId(selected.id);
        if (setCustomerInfo) setCustomerInfo(customerData);
      }
    },
    [customerList, setCustomerInfo, setCustomerId]
  );

  const handleShare = useCallback(
    async (shareType: "direct" | "group") => {
      if (isGuestFlow && !guestPhone) {
        toast.error("Phone number is required for guest orders");
        return;
      }
      try {
        const orderDetails = items
          .map(
            (item) =>
              `🛍️ *${item.name}*\n` +
              `   • Quantity: ${(item.grams / 1000).toFixed(3)} kg\n` +
              `   • Price: Br ${((item.pricePerKg * item.grams) / 1000).toFixed(
                2
              )}`
          )
          .join("\n\n");

        const orderReference = isGuestFlow
          ? `GUEST-${Date.now().toString().slice(-6)}`
          : orderNumber || customerId;

        const storeInfo = `
📍 *Location:* Genet Tower, Office #505
📞 *Contact:* +251947385509
🌐 *Instagram:* @bettyorganic

${
  isGuestFlow
    ? `
🔍 *Next Steps:*
1. We will confirm your order via WhatsApp
2. Delivery options will be discussed
3. Payment details will be shared
4. Order tracking: Use ref #${orderReference}

❓ *Questions?* Reply to this message!`
    : ""
}`;

        const customerInfoText = (() => {
          if (isGuestFlow) {
            return `👤 *Guest Information:*
   • Name: ${guestName}
   • Phone: ${guestPhone}
   • Location: ${guestLocation}`;
          }
          return customerId
            ? `👤 *Customer ID:* ${customerId}\n   🔢 *Order Number:* ${
                orderNumber || "Pending"
              }`
            : "";
        })();

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date();
        dayAfter.setDate(dayAfter.getDate() + 2);
        const formatDeliveryDate = (date: Date) =>
          date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
            hour: "2-digit",
          });

        const shareText = `
🌿 *Betty's Organic Store* 🌿

${isGuestFlow ? "🔔 *NEW GUEST ORDER* 🔔" : "📋 *Order Details*"}
📅 *Order Date:* ${getFormattedDate()}
${
  isGuestFlow
    ? `
📱 *Order Type:* Online Guest Order
⚡ *Priority:* High
🚚 *Expected Delivery:* Between ${formatDeliveryDate(
        tomorrow
      )} - ${formatDeliveryDate(dayAfter)}
📊 *Status:* Pending Confirmation`
    : ""
}

📝 *Order Details:*
${orderDetails}

${customerInfoText}

💰 *Price Summary:*
   • Items Total: Br ${totalAmount.toFixed(2)}
   • Delivery Fee: To be confirmed
   • Total: Br ${totalAmount.toFixed(2)} + Delivery

💳 *Payment:* Cash on Delivery / Bank Transfer
🚚 *Delivery Area:* ${guestLocation}

✨ Thank you for choosing Betty Organic! ✨

${storeInfo}`;

        if (shareType === "group") {
          window.open(
            "https://chat.whatsapp.com/your-group-invite-link",
            "_blank"
          );
        } else {
          const targetPhone =
            isGuestFlow && guestPhone
              ? guestPhone.replace("+", "")
              : "251947385509";
          const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(
            shareText
          )}`;
          window.open(whatsappUrl, "_blank");
        }
      } catch (error) {
        console.error("Error sharing:", error);
      }
    },
    [
      items,
      totalAmount,
      customerId,
      isGuestFlow,
      guestName,
      guestPhone,
      guestLocation,
      orderNumber,
      getFormattedDate,
    ]
  );

  return (
    <motion.div
      key="order-summary"
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: "0%" }}
      exit={{ opacity: 0, x: "-100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="space-y-4"
    >
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold text-lg">Order Summary</h3>
          {orderNumber && (
            <p className="text-sm text-muted-foreground">
              Order ID: {orderNumber}
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={onPrintPreview}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-green-500/10 hover:bg-green-500/20 text-green-600"
              >
                <svg
                  className="h-4 w-4 mr-2"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                </svg>
                Share
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleShare("direct")}>
                Share to Manager
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare("group")}>
                Share to Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>
              {item.name} ({item.grams}g)
            </span>
            <span>
              Br. {((item.pricePerKg * item.grams) / 1000).toFixed(2)}
            </span>
          </div>
        ))}
        <div className="flex justify-between text-sm">
          <span>Subtotal:</span>
          <span>Br {(totalAmount - deliveryCost).toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span>Delivery Cost:</span>
          <div className="flex items-center">
            <span className="mr-2">Br</span>
            <Input
              type="number"
              value={deliveryCost}
              onChange={(e) => {
                // IMPORTANT: Make sure we're updating the delivery cost correctly
                // This is a direct fix to ensure the delivery cost is saved to the database
                const newValue = Number(e.target.value);
                console.log("Changing delivery cost to:", newValue);
                if (setDeliveryCost) {
                  // Update the delivery cost in the parent component
                  setDeliveryCost(newValue);
                  console.log("Delivery cost updated to:", newValue);
                } else {
                  console.error("setDeliveryCost function is not available");
                }
              }}
              className="w-24 h-8 text-right"
              min="0"
              step="100"
            />
          </div>
        </div>
        <div className="flex justify-between font-bold">
          <span>Total:</span>
          <span>Br {totalAmount.toFixed(2)}</span>
        </div>
      </div>
      <div className="space-y-4">
        <div className="border rounded-lg p-4 bg-muted/30">
          <h4 className="font-semibold mb-3">Customer Information</h4>
          {isGuestFlow ? (
            <div className="grid gap-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Your Name</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Enter your name"
                      value={guestName}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setGuestName?.(newName);
                        const error = validateGuestName(newName);
                        if (error && newName.length > 0) {
                          toast.error(error);
                        }
                      }}
                      className={`mt-1 pr-8 ${
                        guestName
                          ? validateGuestName(guestName)
                            ? "border-red-500 focus:border-red-500"
                            : "border-green-500 focus:border-green-500"
                          : ""
                      }`}
                    />
                    {guestName && (
                      <div className="absolute right-2 top-[calc(50%_+_4px)]">
                        {validateGuestName(guestName) ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Letters only, {MIN_NAME_LENGTH}-{MAX_NAME_LENGTH} characters
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    Your Phone (WhatsApp)
                  </Label>
                  <div className="relative flex mt-1">
                    <div className="flex items-center px-3 border rounded-l bg-muted/50 border-input">
                      <span className="text-sm text-muted-foreground">
                        +251
                      </span>
                    </div>
                    <Input
                      type="tel"
                      placeholder="9XXXXXXXX"
                      value={guestPhone?.replace("+251", "")}
                      onChange={(e) => {
                        const numbers = e.target.value.replace(/\D/g, "");
                        const newPhone = numbers ? `+251${numbers}` : "";
                        setGuestPhone?.(newPhone);
                      }}
                      className={`rounded-l-none ${
                        guestPhone
                          ? /^\+251\d{9}$/.test(guestPhone)
                            ? "border-green-500 focus:border-green-500"
                            : "border-red-500 focus:border-red-500"
                          : ""
                      }`}
                      maxLength={9}
                    />
                    {guestPhone && (
                      <div className="absolute right-2 top-[calc(50%_-_8px)]">
                        {validatePhone(guestPhone) !== null ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter your 9-digit phone number (e.g., 912345678)
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Your Location</Label>
                <div className="space-y-1">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Enter your location (e.g., Bole, Addis Ababa)"
                      value={guestLocation}
                      onChange={(e) => {
                        const newLocation = e.target.value;
                        setGuestLocation?.(newLocation);
                        const error = validateGuestLocation(newLocation);
                        if (error && newLocation.length > 0) {
                          toast.error(error);
                        }
                      }}
                      className={`mt-1 pr-8 ${
                        guestLocation
                          ? validateGuestLocation(guestLocation)
                            ? "border-red-500 focus:border-red-500"
                            : "border-green-500 focus:border-green-500"
                          : ""
                      }`}
                    />
                    {guestLocation && (
                      <div className="absolute right-2 top-[calc(50%_-_8px)]">
                        {validateGuestLocation(guestLocation) ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Please provide a detailed delivery address (
                    {MIN_LOCATION_LENGTH}-{MAX_LOCATION_LENGTH} characters)
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Customer</Label>
                <Select
                  onValueChange={handleCustomerChange}
                  value={selectedCustomer?.id || customerId || ""}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customerList.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} ({customer.id.substring(28)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
        {isAdmin && !isGuestFlow && (
          <div className="flex items-center space-x-2">
            <div className="flex-grow">
              <Label htmlFor="order-status" className="text-sm font-medium">
                Order Status
              </Label>
              <Select
                value={orderStatus}
                onValueChange={handleOrderStatusChange}
              >
                <SelectTrigger id="order-status" className="mt-1">
                  <SelectValue placeholder="Select order status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="mt-6"
              onClick={handleToggleLock}
            >
              {orderStatus === "pending" ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>
      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={() => handleConfirmDialog("cancel", null)}
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (isGuestFlow) {
              const nameError = validateGuestName(guestName?.trim() || "");
              const locationError = validateGuestLocation(
                guestLocation?.trim() || ""
              );
              const phoneError = validatePhone(guestPhone || "");
              if (nameError) {
                toast.error(nameError);
                return;
              }
              if (locationError) {
                toast.error(locationError);
                return;
              }
              if (phoneError) {
                toast.error(phoneError);
                return;
              }
              onGuestOrderConfirm?.();
            } else {
              if (!profile) {
                toast.error("You must be logged in to create an order");
                return;
              }
              if (!profile.role) {
                toast.error("Your profile is missing required permissions");
                return;
              }
              if (profile.role !== "admin" && profile.role !== "sales") {
                toast.error(
                  "Access Denied - Only admin or sales users can create orders"
                );
                return;
              }

              // Create customer data with valid UUID
              const customerUuid = selectedCustomer
                ? selectedCustomer.id
                : crypto.randomUUID();
              const orderCustomer = {
                id: customerUuid,
                name: selectedCustomer
                  ? selectedCustomer.name
                  : "Unknown Customer",
                role: "customer" as const,
                // Ensure these match the expected structure for an order
                profile_id: profile.id, // The seller/staff member's ID
                customer_profile_id: customerUuid, // The customer's ID (same as id)
              };

              handleConfirmDialog("save", orderCustomer);
            }
          }}
          disabled={
            isGuestFlow
              ? isSaving ||
                !guestName?.trim() ||
                !guestLocation?.trim() ||
                validatePhone(guestPhone || "") !== null ||
                isOrderSaved
              : isSaving || !selectedCustomer || isOrderSaved
          }
          className={`relative min-w-[200px] ${
            isGuestFlow
              ? isOrderSaved
                ? "bg-gray-600 hover:bg-gray-700"
                : "bg-green-600 hover:bg-green-700"
              : ""
          } text-white`}
        >
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {isGuestFlow ? "Opening WhatsApp..." : "Saving..."}
            </span>
          ) : isGuestFlow ? (
            isOrderSaved ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Order Sent
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                </svg>
                Confirm via WhatsApp
              </span>
            )
          ) : isOrderSaved ? (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Order Saved
            </span>
          ) : (
            "Save Order"
          )}
        </Button>
      </div>
    </motion.div>
  );
};
