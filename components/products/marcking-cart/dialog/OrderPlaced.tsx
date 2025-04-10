"use client";

import React from "react";
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
}

export default function OrderPlaced({
    isAuthenticated,
    orderDetails,
    customerInfo,
    handleShareWhatsAppAction,
    handleSignInAction,
    onCloseAction
}: OrderPlacedProps): React.ReactElement {
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
                        onClick={onCloseAction}
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
                <DialogTitle className="text-green-600">Order Placed!</DialogTitle>
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

                    {/* Button to continue shopping */}
                    <Button
                        variant="default"
                        className="w-full gap-2 bg-green-600 hover:bg-green-700"
                        onClick={onCloseAction}
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Continue Shopping
                    </Button>
                </div>
            </DialogFooter>
        </>
    );
}
