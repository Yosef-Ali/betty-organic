"use client";

import React, { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { LogIn, ShoppingBag, MessageCircle, Printer, Receipt } from "lucide-react";
import { OrderDetails, CustomerInfo } from "./types";
import { useMarketingCartStore } from "@/store/cartStore";
import { OrderReceiptModal } from "./OrderReceiptModal";

interface OrderPlacedProps {
    isAuthenticated: boolean;
    orderDetails: OrderDetails;
    customerInfo: CustomerInfo;
    handleSignInAction: () => void;
    onCloseAction: () => void;
    processOrder?: () => void;
    shouldProcessOrder?: boolean;
    resetCart?: () => void;
    clearOrderData?: () => void; // New prop to clear order data in parent component
}

export default function OrderPlaced({
    isAuthenticated,
    orderDetails,
    customerInfo,
    handleSignInAction,
    onCloseAction,
    processOrder,
    shouldProcessOrder = true,
    resetCart,
    clearOrderData
}: OrderPlacedProps): React.ReactElement {
    const [orderProcessed, setOrderProcessed] = useState(false);
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const { setContinuingShopping } = useMarketingCartStore();

    // Process order when component mounts if shouldProcessOrder is true
    useEffect(() => {
        // Always clear local storage when component mounts to ensure fresh data
        if (typeof window !== 'undefined') {
            localStorage.removeItem('orderDetails');
            localStorage.removeItem('cartItems');
            localStorage.removeItem('checkoutData');
        }

        // Reset the orderProcessed state when the component mounts
        setOrderProcessed(false);

        if (isAuthenticated && processOrder && shouldProcessOrder && !orderProcessed) {
            console.log("Processing order from OrderPlaced component...");
            processOrder();
            setOrderProcessed(true);

            // Reset cart data after successful order processing
            if (resetCart) {
                resetCart();
            }
        }

        // Cleanup function that runs when component unmounts
        return () => {
            // We need to clean up any state before the component is used again
            if (clearOrderData) {
                clearOrderData();
            }
            setOrderProcessed(false);
        };
    }, [isAuthenticated, processOrder, shouldProcessOrder, resetCart, clearOrderData, orderDetails.display_id]);

    // Custom close handler for continuing shopping
    const handleClose = () => {
        // Set flag to indicate user is continuing shopping (preserve cart for next time)
        setContinuingShopping(true);

        // Reset processed state on close
        setOrderProcessed(false);

        // Clear order data before closing - this is essential to reset for next order
        if (clearOrderData) {
            clearOrderData();
        }

        // DON'T reset cart since user wants to continue shopping
        // if (resetCart) { resetCart(); } - REMOVED

        // Dispatch an event to notify other components (no refresh needed)
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('orderCompleted', {
                detail: { timestamp: Date.now(), shouldRefresh: false, continueShopping: true }
            }));
        }

        // Call original close handler
        onCloseAction();

        // DON'T refresh the page when continuing shopping
        // The user wants to continue with their current cart state
    };

    // Force a manual refresh on window object after processing order
    useEffect(() => {
        if (orderProcessed) {
            const timer = setTimeout(() => {
                if (typeof window !== 'undefined' && window.location) {
                    // Force the cart state to refresh in parent components
                    const event = new CustomEvent('orderCompleted', { detail: { timestamp: Date.now() } });
                    window.dispatchEvent(event);
                }
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [orderProcessed]);

    // Format order data for the print preview
    const formatOrderForPrint = () => {
        return {
            items: orderDetails.items.map(item => ({
                name: item.name,
                quantity: item.grams / 1000, // Convert grams to kg
                price: item.price
            })),
            total: orderDetails.total,
            customerInfo: isAuthenticated 
                ? `${orderDetails.customer_name} (${orderDetails.customer_phone})`
                : `${orderDetails.customer_name} (${orderDetails.customer_phone})`,
            customerId: orderDetails.display_id
        };
    };

    if (!isAuthenticated) {
        // Guest order complete view
        const handleShareWhatsApp = () => {
            const message = `🍎 *New Order - Betty Organic*

*Order ID:* ${orderDetails.display_id}
*Customer:* ${orderDetails.customer_name}
*Phone:* ${orderDetails.customer_phone}
*Delivery Address:* ${orderDetails.delivery_address}

*Items:*
${orderDetails.items.map(item => `• ${item.name} (${item.grams}g) - ETB ${item.price.toFixed(2)}`).join('\n')}

*Total Amount:* ETB ${orderDetails.total.toFixed(2)}

*Order Time:* ${new Date(orderDetails.created_at).toLocaleString()}

Please prepare and deliver this order. Thank you! 🚚`;

            // Get admin WhatsApp number from localStorage settings
            const savedSettings = localStorage.getItem('whatsAppSettings');
            let adminNumber = '';
            
            if (savedSettings) {
                try {
                    const settings = JSON.parse(savedSettings);
                    adminNumber = settings.adminPhoneNumber || '';
                } catch (error) {
                    console.error('Failed to parse WhatsApp settings:', error);
                }
            }

            // Create WhatsApp URL - if admin number exists, send directly to admin, otherwise general share
            const whatsappUrl = adminNumber 
                ? `https://wa.me/${adminNumber.replace('+', '')}?text=${encodeURIComponent(message)}`
                : `https://wa.me/?text=${encodeURIComponent(message)}`;
                
            window.open(whatsappUrl, '_blank');
        };

        return (
            <>
                <DialogHeader>
                    <DialogTitle className="text-green-600 flex items-center gap-2">
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5"
                        >
                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Order Placed!
                    </DialogTitle>
                    <DialogDescription>
                        Your order has been sent to our team for processing. We&apos;ll contact you soon!
                    </DialogDescription>
                </DialogHeader>

                <div className="my-4 p-4 border rounded-md bg-gray-50">
                    <h3 className="font-medium text-lg mb-2">Order Summary</h3>

                    <ScrollArea className="max-h-[150px] mb-4">
                        <div className="space-y-2">
                            {orderDetails.items.map((item, index) => (
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
                        <span>ETB {orderDetails.total.toFixed(2)}</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    {/* Button to continue shopping */}
                    <Button
                        variant="default"
                        className="flex-1 gap-2 bg-green-600 hover:bg-green-700 h-12"
                        onClick={handleClose}
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Continue Shopping
                    </Button>
                    
                    {/* Print Receipt button - icon only */}
                    <Button
                        variant="outline"
                        className="w-12 h-12 p-0 border-blue-600 text-blue-600 hover:bg-blue-50"
                        onClick={() => setShowPrintPreview(true)}
                        title="Print Receipt"
                    >
                        <Receipt className="w-5 h-5" />
                    </Button>
                    
                    {/* Notify Admin via WhatsApp - icon only */}
                    <Button
                        variant="outline"
                        className="w-12 h-12 p-0 border-green-600 text-green-600 hover:bg-green-50"
                        onClick={handleShareWhatsApp}
                        title="Notify Admin via WhatsApp"
                    >
                        <MessageCircle className="w-5 h-5" />
                    </Button>
                </div>

                <div className="text-center mt-4 flex flex-col gap-2">
                    <div className="text-xs text-muted-foreground">
                        Your order has been sent to our team for processing
                    </div>
                    <div className="flex justify-center">
                        <Button variant="link" size="sm" onClick={handleSignInAction}>
                            <LogIn className="w-4 h-4 mr-1" />
                            Sign in to track your orders
                        </Button>
                    </div>
                </div>
            </>
        );
    }

    // Signed-in user order complete view
    const handleShareWhatsApp = () => {
        const message = `🍎 *New Order - Betty Organic*

*Order ID:* ${orderDetails.display_id}
*Customer:* ${orderDetails.customer_name}
*Phone:* ${orderDetails.customer_phone}
*Delivery Address:* ${customerInfo.address}

*Items:*
${orderDetails.items.map(item => `• ${item.name} (${item.grams}g) - ETB ${item.price.toFixed(2)}`).join('\n')}

*Total Amount:* ETB ${orderDetails.total.toFixed(2)}

*Order Time:* ${new Date(orderDetails.created_at).toLocaleString()}

Please prepare and deliver this order. Thank you! 🚚`;

        // Get admin WhatsApp number from localStorage settings
        const savedSettings = localStorage.getItem('whatsAppSettings');
        let adminNumber = '';
        
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                adminNumber = settings.adminPhoneNumber || '';
            } catch (error) {
                console.error('Failed to parse WhatsApp settings:', error);
            }
        }

        // Create WhatsApp URL - if admin number exists, send directly to admin, otherwise general share
        const whatsappUrl = adminNumber 
            ? `https://wa.me/${adminNumber.replace('+', '')}?text=${encodeURIComponent(message)}`
            : `https://wa.me/?text=${encodeURIComponent(message)}`;
            
        window.open(whatsappUrl, '_blank');
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle className="text-green-600 flex items-center gap-2">
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                    >
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Order Placed!
                </DialogTitle>
                <DialogDescription>
                    Your order #{orderDetails.display_id} has been successfully placed.
                </DialogDescription>
            </DialogHeader>

            <div className="my-4 p-4 border rounded-md bg-gray-50">
                <h3 className="font-medium text-lg mb-2">Order Summary</h3>

                <ScrollArea className="max-h-[150px] mb-4">
                    <div className="space-y-2">
                        {orderDetails.items.map((item, index) => (
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
                </div>

                <div className="text-sm font-medium flex justify-between border-t pt-2">
                    <span>Total Amount:</span>
                    <span>ETB {orderDetails.total.toFixed(2)}</span>
                </div>
            </div>

            <DialogFooter className="flex flex-col gap-3 sm:flex-col">
                <div className="text-center text-sm text-green-600 mb-2">
                    Order confirmation sent! Your order is being processed.
                </div>
                <div className="flex gap-2 w-full">
                    {/* Button to continue shopping */}
                    <Button
                        variant="default"
                        className="flex-1 gap-2 bg-green-600 hover:bg-green-700 h-12"
                        onClick={handleClose}
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Continue Shopping
                    </Button>
                    
                    {/* Print Receipt button - icon only */}
                    <Button
                        variant="outline"
                        className="w-12 h-12 p-0 border-blue-600 text-blue-600 hover:bg-blue-50"
                        onClick={() => setShowPrintPreview(true)}
                        title="Print Receipt"
                    >
                        <Receipt className="w-5 h-5" />
                    </Button>
                    
                    {/* Optional WhatsApp Share - icon only */}
                    <Button
                        variant="outline"
                        className="w-12 h-12 p-0 border-green-600 text-green-600 hover:bg-green-50"
                        onClick={handleShareWhatsApp}
                        title="Share via WhatsApp (Optional)"
                    >
                        <MessageCircle className="w-5 h-5" />
                    </Button>
                </div>
            </DialogFooter>
            
            {/* Order Receipt Modal */}
            {showPrintPreview && (
                <OrderReceiptModal
                    isOpen={showPrintPreview}
                    onClose={() => setShowPrintPreview(false)}
                    items={formatOrderForPrint().items}
                    total={formatOrderForPrint().total}
                    customerInfo={formatOrderForPrint().customerInfo}
                    orderId={formatOrderForPrint().customerId}
                />
            )}
        </>
    );
}
