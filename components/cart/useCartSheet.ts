import { useState, useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import { usePathname } from 'next/navigation';
import { createOrder } from "@/app/actions/orderActions";
import { Order } from "@/types/order";
import { Customer } from "@/types/customer";

export const useCartSheet = (onOpenChange: (open: boolean) => void) => {
  const { items, clearCart, getTotalAmount } = useCartStore();
  const [customer, setCustomer] = useState<Customer>({
    name: "",
    email: ""
  });
  const [orderStatus, setOrderStatus] = useState<Order['status']>("pending");
  const [isThermalPrintPreviewOpen, setIsThermalPrintPreviewOpen] = useState(false);
  const [isOrderConfirmed, setIsOrderConfirmed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"save" | "cancel">("save");
  const [isStatusVerified, setIsStatusVerified] = useState<boolean | undefined>(false);
  const [isOtpDialogOpen, setIsOtpDialogOpen] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [hasToggledLock, setHasToggledLock] = useState(false);
  const [isOrderSaved, setIsOrderSaved] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>("");

  const pathname = usePathname();

  const onOtpChange = (index: number, value: string) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
  };

  const handleOtpSubmit = () => {
    console.log("OTP submitted:", otp.join(""));
  };

  useEffect(() => {
    if (items.length === 0) {
      setIsOrderConfirmed(false);
      setIsStatusVerified(false);
      setHasToggledLock(false);
    }
  }, [items]);

  const handleThermalPrintPreview = () => {
    setIsThermalPrintPreviewOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    try {
      const orderDetails = items.map(item =>
        `${item.name} (${item.grams}g): Br ${((item.pricePerKg * item.grams) / 1000).toFixed(2)}`
      ).join('\n');

      const shareText = `*Betty Organic Order*\n\n${orderDetails}\n\n*Total: Br ${getTotalAmount().toFixed(2)}*`;

      if (navigator.share) {
        await navigator.share({
          title: 'Betty Organic Order',
          text: shareText,
        });
      } else {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleConfirmOrder = async () => {
    setIsOrderConfirmed(true);
  };

  const handleBackToCart = () => {
    setIsOrderConfirmed(false);
    setIsStatusVerified(false);
    setHasToggledLock(false);
  };

  const handleSaveOrder = async () => {
    if (!customer.name.trim() || !customer.email.trim()) {
      alert("Please provide your name and email to proceed with the order.");
      return;
    }

    setIsSaving(true);
    try {
      const totalAmount = getTotalAmount();
      const orderItems = items.map(item => ({
        product_id: item.id,
        quantity: item.grams,
        price: (item.pricePerKg * item.grams) / 1000,
        name: item.name,
      }));

      const orderData: Order = {
        customer_id: "guest",
        customerId: "guest",
        status: orderStatus,
        total_amount: totalAmount,
        totalAmount: totalAmount,
        type: pathname.includes('/dashboard/sales') ? 'store' : 'online',
        items: orderItems,
        customerInfo: customer,
        orderNumber: `ORDER-${Date.now()}`,
      };

      await createOrder(orderData);
      setOrderNumber(orderData.orderNumber);
      setIsOrderSaved(true);
      clearCart();
    } catch (error) {
      console.error("Failed to save order:", error);
      alert("Failed to save order. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseCart = () => {
    if (items.length > 0) {
      setConfirmAction("cancel");
      if (confirmAction) {
        setIsConfirmDialogOpen(true);
      }
    } else {
      onOpenChange(false);
    }
  };

  const handleConfirmDialog = (action: "save" | "cancel") => {
    if (action === "save" || action === "cancel") {
      setConfirmAction(action);
      setIsConfirmDialogOpen(true);
    }
  };

  const handleConfirmAction = () => {
    if (confirmAction === "save") {
      handleSaveOrder();
    } else if (confirmAction === "cancel") {
      clearCart();
      onOpenChange(false);
    }
    setIsConfirmDialogOpen(false);
  };

  return {
    items,
    customer,
    setCustomer,
    orderStatus,
    setOrderStatus,
    isThermalPrintPreviewOpen,
    setIsThermalPrintPreviewOpen,
    isOrderConfirmed,
    setIsOrderConfirmed,
    isSaving,
    setIsSaving,
    isConfirmDialogOpen,
    setIsConfirmDialogOpen,
    confirmAction,
    setConfirmAction,
    isStatusVerified,
    setIsStatusVerified,
    isOtpDialogOpen,
    setIsOtpDialogOpen,
    otp,
    setOtp,
    hasToggledLock,
    setHasToggledLock,
    isOrderSaved,
    setIsOrderSaved,
    orderNumber,
    setOrderNumber,
    getTotalAmount,
    onOtpChange,
    handleOtpSubmit,
    handleThermalPrintPreview,
    handlePrint,
    handleShare,
    handleConfirmOrder,
    handleBackToCart,
    handleSaveOrder,
    handleCloseCart,
    handleConfirmDialog,
    handleConfirmAction,
  };
};
