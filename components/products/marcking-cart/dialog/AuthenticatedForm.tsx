"use client";

import React, { useState } from "react";
import { CartItemType } from "@/types/cart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { MessageCircle, User } from "lucide-react";
import { createInfoChangeHandler } from "./utils";
import { AuthenticatedFormProps } from "./types";

export const AuthenticatedForm: React.FC<AuthenticatedFormProps> = ({
    items,
    total,
    customerInfo,
    setCustomerInfoAction,
    isSubmitting,
    handleConfirmAction,
    onCancelAction,
    isCustomerInfoValidAction,
    profileData,
    userEmail,
}: AuthenticatedFormProps) => {
    const handleInfoChange = createInfoChangeHandler('address', setCustomerInfoAction);

    return (
        <div className="flex flex-col max-h-[calc(90vh-4rem)] text-foreground">
            {/* Header - Updated */}
            <DialogHeader className="flex-shrink-0">
                <DialogTitle className="text-foreground">Complete Your Order</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                    Review your items and confirm delivery details
                </DialogDescription>
            </DialogHeader>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto space-y-4 mt-4">
                {/* Order items */}
                <div className="border border-border rounded-lg p-3 bg-muted/30">
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
            </div>

            {/* Footer - Always visible */}
            <DialogFooter className="flex-shrink-0 flex items-center justify-between mt-4 pt-4 border-t border-border bg-background">
                <Button variant="outline" onClick={onCancelAction} className="border-border hover:bg-accent hover:text-accent-foreground">
                    Cancel
                </Button>
                <Button
                    onClick={handleConfirmAction}
                    disabled={isSubmitting || !isCustomerInfoValidAction()}
                    className="gap-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                    <MessageCircle className="w-4 h-4" />
                    {isSubmitting ? 'Processing...' : 'Confirm Order'}
                </Button>
            </DialogFooter>
        </div>
    );
};
