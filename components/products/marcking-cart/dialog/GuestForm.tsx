"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Share2, User, LogIn, ShoppingCart } from "lucide-react";
import { createInfoChangeHandler } from "./utils";
import { GuestFormProps } from "./types";

export const GuestForm = ({
    items,
    total,
    customerInfo,
    setCustomerInfoAction,
    isSubmitting,
    handleConfirmAction,
    handleSignInAction,
    handleDirectOrderAction,
    onCancelAction,
    isCustomerInfoValidAction,
}: GuestFormProps) => {
    const handleAddressChange = createInfoChangeHandler('address', setCustomerInfoAction);

    return (
        <div className="relative">
            {/* Main Form Content */}
            <DialogHeader>
                <DialogTitle>Order Details</DialogTitle>
                <DialogDescription>
                    Review your order and provide contact details
                </DialogDescription>
            </DialogHeader>

            {/* Order items with Contact & Delivery Details integrated */}
            <div className="mt-4 mb-4 border rounded-lg p-3 bg-gray-50">
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

                    {/* Contact & Delivery Summary Button - Compact */}
                    <div className="pt-4 border-t">
                        <div
                            className="w-full flex items-center justify-between p-3 h-auto border rounded-lg bg-gray-50"
                        >
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span className="text-sm font-medium">Contact & Delivery</span>
                            </div>
                            <div className="text-right">
                                {customerInfo.phone && customerInfo.address ? (
                                    <span className="text-xs text-green-600 font-medium">✓ Complete</span>
                                ) : (
                                    <span className="text-xs text-orange-600">⚠ Required</span>
                                )}
                            </div>
                        </div>
                        {customerInfo.phone && customerInfo.address ? (
                            <div className="mt-2 text-xs text-gray-600 px-2">
                                <div><strong>Phone:</strong> {customerInfo.phone}</div>
                                <div><strong>Address:</strong> {customerInfo.address}</div>
                            </div>
                        ) : (
                            <div className="mt-2 text-xs text-orange-600 px-2">
                                Please set contact details in the cart first
                            </div>
                        )}
                    </div>

                    {/* Total - After Contact Details */}
                    <div className="pt-4 border-t flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>ETB {total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 flex items-center gap-2 font-medium mb-1">
                    <ShoppingCart className="w-4 h-4 flex-shrink-0" />
                    Choose how to complete your order
                </p>
                <p className="text-xs text-blue-600 leading-relaxed">
                    Submit directly to our system or share via WhatsApp for personal assistance
                </p>
            </div>

            <DialogFooter className="flex flex-col gap-3 mt-6 pt-4 border-t w-full">
                {/* Main action buttons - in one line */}
                <div className="flex gap-2 w-full">
                    {handleDirectOrderAction && (
                        <Button
                            onClick={handleDirectOrderAction}
                            disabled={isSubmitting || !isCustomerInfoValidAction()}
                            className="gap-2 flex-1 h-12"
                            variant="default"
                        >
                            <ShoppingCart className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm font-medium">
                                {isSubmitting ? 'Processing...' : 'Submit Order'}
                            </span>
                        </Button>
                    )}
                    <Button
                        onClick={handleConfirmAction}
                        disabled={isSubmitting || !isCustomerInfoValidAction()}
                        className="w-12 h-12 p-0"
                        variant="outline"
                        title="Share on WhatsApp"
                    >
                        <Share2 className="w-5 h-5" />
                    </Button>
                </div>

                {/* Secondary actions - Cancel and Sign in in one line */}
                <div className="flex justify-center gap-3 w-full pt-2 border-t border-gray-100">
                    <Button
                        variant="ghost"
                        onClick={onCancelAction}
                        size="sm"
                        className="text-gray-500 hover:text-gray-700"
                    >
                        Cancel
                    </Button>
                    {handleSignInAction && (
                        <Button
                            variant="ghost"
                            onClick={handleSignInAction}
                            className="gap-1 text-blue-600 hover:text-blue-700"
                            size="sm"
                        >
                            <LogIn className="w-3 h-3" />
                            Sign in
                        </Button>
                    )}
                </div>
            </DialogFooter>
        </div>
    );
};
