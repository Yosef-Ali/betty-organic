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
import { Share2, LogIn, ShoppingBag } from "lucide-react";
import { OrderDetails, CustomerInfo } from "./types";

interface OrderPlacedProps {
    isAuthenticated: boolean;
    orderDetails: OrderDetails;
    customerInfo: CustomerInfo;
    handleShareWhatsAppAction: () => void;
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
    handleShareWhatsAppAction,
    handleSignInAction,
    onCloseAction,
    processOrder,
    shouldProcessOrder = true,
    resetCart,
    clearOrderData
}: OrderPlacedProps): React.ReactElement {
    const [orderProcessed, setOrderProcessed] = useState(false);

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

    // Custom close handler that refreshes the page
    const handleClose = () => {
        // Reset processed state on close
        setOrderProcessed(false);

        // Clear order data before closing - this is essential to reset for next order
        if (clearOrderData) {
            clearOrderData();
        }

        // Reset cart to ensure fresh state for next order
        if (resetCart) {
            resetCart();
        }

        // Dispatch an event to notify other components before refresh
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('orderCompleted', {
                detail: { timestamp: Date.now(), shouldRefresh: true }
            }));
        }

        // Call original close handler
        onCloseAction();

        // Refresh the page when dialog is closed
        if (typeof window !== 'undefined') {
            // Use a small timeout to ensure the dialog is fully closed first
            setTimeout(() => {
                window.location.reload();
            }, 300);
        }
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

    if (!isAuthenticated) {
        // Guest order complete view
        return (
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

                <div className="flex flex-col gap-3">
                    <Button
                        variant="default"
                        className="w-full gap-2 bg-green-600 hover:bg-green-700 py-6"
                        onClick={handleShareWhatsAppAction}
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

                    {/* Button to continue shopping */}
                    <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={handleClose}
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Continue Shopping
                    </Button>
                </div>

                <div className="text-center mt-4 flex flex-col gap-2">
                    <div className="text-xs text-muted-foreground">
                        Your order will only be processed after sharing via WhatsApp
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
                <div className="flex flex-col gap-3 w-full">
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleShareWhatsAppAction}
                    >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share via WhatsApp
                    </Button>

                    <Button
                        variant="default"
                        className="w-full gap-2 bg-green-600 hover:bg-green-700"
                        onClick={handleClose}
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Continue Shopping
                    </Button>
                </div>
            </DialogFooter>
        </>
    );
}
