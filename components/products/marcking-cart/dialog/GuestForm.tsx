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
        <div className="relative text-foreground">
            {/* Main Form Content */}
            <DialogHeader>
                <DialogTitle className="text-foreground">Order Details</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                    Review your order and provide contact details
                </DialogDescription>
            </DialogHeader>

            {/* Order items with Contact & Delivery Details integrated */}
            <div className="mt-4 mb-4 border border-border rounded-lg p-3 bg-muted/30">
                <div className="space-y-4">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="flex justify-between items-center py-2 border-b border-border"
                        >
                            <div className="flex flex-col">
                                <span className="font-medium text-foreground">{item.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">{item.grams}g</span>
                                    <span className="text-xs text-muted-foreground">
                                        (ETB {item.pricePerKg}/kg)
                                    </span>
                                </div>
                            </div>
                            <span className="font-medium text-foreground">
                                ETB {((item.pricePerKg * item.grams) / 1000).toFixed(2)}
                            </span>
                        </div>
                    ))}

                    {/* Contact & Delivery Summary Button - Compact */}
                    <div className="pt-4 border-t border-border">
                        <div
                            className="w-full flex items-center justify-between p-3 h-auto border border-border rounded-lg bg-muted/50"
                        >
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span className="text-sm font-medium text-foreground">Contact & Delivery</span>
                            </div>
                            <div className="text-right">
                                {customerInfo.phone && customerInfo.address ? (
                                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Complete</span>
                                ) : (
                                    <span className="text-xs text-orange-600 dark:text-orange-400">⚠ Required</span>
                                )}
                            </div>
                        </div>
                        {customerInfo.phone && customerInfo.address ? (
                            <div className="mt-2 text-xs text-muted-foreground px-2">
                                <div><strong>Phone:</strong> {customerInfo.phone}</div>
                                <div><strong>Address:</strong> {customerInfo.address}</div>
                            </div>
                        ) : (
                            <div className="mt-2 text-xs text-orange-600 dark:text-orange-400 px-2">
                                Please set contact details in the cart first
                            </div>
                        )}
                    </div>

                    {/* Total - After Contact Details */}
                    <div className="pt-4 border-t border-border flex justify-between font-bold text-lg text-foreground">
                        <span>Total:</span>
                        <span>ETB {total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2 font-medium mb-1">
                    <ShoppingCart className="w-4 h-4 flex-shrink-0" />
                    Choose how to complete your order
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                    Submit directly to our system or share via WhatsApp for personal assistance
                </p>
            </div>

            <DialogFooter className="flex flex-col gap-3 mt-6 pt-4 border-t border-border w-full">
                {/* Main action buttons - in one line */}
                <div className="flex gap-2 w-full">
                    {handleDirectOrderAction && (
                        <Button
                            onClick={handleDirectOrderAction}
                            disabled={isSubmitting || !isCustomerInfoValidAction()}
                            className="gap-2 flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
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
                        className="w-12 h-12 p-0 border-border hover:bg-accent hover:text-accent-foreground"
                        variant="outline"
                        title="Share on WhatsApp"
                    >
                        <Share2 className="w-5 h-5" />
                    </Button>
                </div>

                {/* Secondary actions - Cancel and Sign in in one line */}
                <div className="flex justify-center gap-3 w-full pt-2 border-t border-border">
                    <Button
                        variant="ghost"
                        onClick={onCancelAction}
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                    >
                        Cancel
                    </Button>
                    {handleSignInAction && (
                        <Button
                            variant="ghost"
                            onClick={handleSignInAction}
                            className="gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
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
