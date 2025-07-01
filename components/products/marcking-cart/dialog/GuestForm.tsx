"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { User, ShoppingCart, ChevronRight, AlertTriangle } from "lucide-react";
import { GuestFormProps } from "./types";
import { ContactDeliveryDialog } from "@/components/ContactDeliveryDialog";

export const GuestForm = ({
    items,
    total,
    customerInfo,
    setCustomerInfoAction,
    isSubmitting,
    handleSignInAction,
    handleDirectOrderAction,
    onCancelAction,
    isCustomerInfoValidAction,
}: GuestFormProps) => {
    const [isContactDeliveryOpen, setIsContactDeliveryOpen] = useState(false);

    const handleOpenContactDelivery = () => {
        setIsContactDeliveryOpen(true);
    };

    const handleContactDeliveryClose = (open: boolean) => {
        setIsContactDeliveryOpen(open);
    };

    const handleCustomerInfoChange = (info: { name: string; phone: string; address: string }) => {
        setCustomerInfoAction(info);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Main Form Content */}
            <DialogHeader className="flex-shrink-0">
                <DialogTitle className="text-lg text-foreground">Quick Order Checkout</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                    Complete your order as a guest or create an account for faster checkout
                </DialogDescription>
            </DialogHeader>

            {/* Main content area with scroll */}
            <ScrollArea className="flex-1 mt-4">
                <div className="pr-4 space-y-4">
                    {/* Required Information Banner */}
                    <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-amber-700 dark:text-amber-300 font-medium mb-1">
                                    Phone and delivery address required to proceed
                                </p>
                                <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
                                    Please provide your contact details and delivery address to complete your order
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Order items with Contact & Delivery Details integrated */}
                    <div className="p-3 bg-muted/30 border border-border rounded-lg">
                        <div className="space-y-3">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex justify-between items-center py-2 border-b border-border last:border-b-0"
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

                            {/* Contact & Delivery Summary Button - Clickable */}
                            <div className="pt-3 border-t border-border">
                                <div
                                    className="w-full flex items-center justify-between p-3 h-auto border border-border rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                                    onClick={handleOpenContactDelivery}
                                >
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        <span className="text-sm font-medium text-foreground">Contact & Delivery Details</span>
                                        {(!customerInfo.phone || !customerInfo.address) && (
                                            <div className="flex items-center gap-1 text-amber-600">
                                                <AlertTriangle className="w-3 h-3" />
                                                <span className="text-xs">Required</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {customerInfo.phone && customerInfo.address && (
                                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Complete</span>
                                        )}
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    </div>
                                </div>
                                {customerInfo.phone && customerInfo.address ? (
                                    <div className="mt-2 text-xs text-muted-foreground px-2">
                                        <div><strong>Phone:</strong> {customerInfo.phone}</div>
                                        <div><strong>Address:</strong> {customerInfo.address}</div>
                                    </div>
                                ) : (
                                    <div className="mt-2 text-xs text-orange-600 dark:text-orange-400 px-2">
                                        Please provide your contact and delivery details above
                                    </div>
                                )}
                            </div>

                            {/* Total - After Contact Details */}
                            <div className="pt-3 border-t border-border flex justify-between font-bold text-lg text-foreground">
                                <span>Total:</span>
                                <span>ETB {total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Order Completion Options */}
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2 font-medium mb-1">
                            <ShoppingCart className="w-4 h-4 flex-shrink-0" />
                            Ready to get your fresh organic products?
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                            Submit your order now and we'll arrange delivery shortly
                        </p>
                    </div>
                </div>
            </ScrollArea>

            <DialogFooter className="flex-shrink-0 pt-4 border-t border-border flex flex-col gap-3">
                {/* Main action - Order as Guest (full width, primary style) */}
                {handleDirectOrderAction && (
                    <Button
                        onClick={handleDirectOrderAction}
                        disabled={isSubmitting || !isCustomerInfoValidAction()}
                        className="w-full gap-2 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium text-base"
                        variant="default"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <ShoppingCart className="w-4 h-4 flex-shrink-0" />
                                Order as Guest
                            </>
                        )}
                    </Button>
                )}

                {/* Secondary actions - Cancel and Create Account */}
                <div className="flex flex-col gap-2">
                    <Button
                        variant="outline"
                        onClick={onCancelAction}
                        disabled={isSubmitting}
                        className="w-full border-border hover:bg-accent hover:text-accent-foreground"
                    >
                        Cancel
                    </Button>
                    
                    <button
                        type="button"
                        onClick={handleSignInAction}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-700 dark:hover:text-blue-300 font-medium text-center py-2"
                        disabled={isSubmitting}
                    >
                        Create an account for faster checkout and order tracking
                    </button>
                </div>
            </DialogFooter>

            {/* Contact & Delivery Dialog */}
            <ContactDeliveryDialog
                isOpen={isContactDeliveryOpen}
                onOpenChangeAction={handleContactDeliveryClose}
                customerInfo={customerInfo}
                onCustomerInfoChangeAction={handleCustomerInfoChange}
            />
        </div>
    );
};
