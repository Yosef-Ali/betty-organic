"use client";

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
import { MessageCircle, MapPin, User, Phone } from "lucide-react";
import { createInfoChangeHandler } from "./utils";
import { CustomerInfo, FormProps } from "./types";

interface AuthenticatedFormProps extends Omit<FormProps, 'handleSignIn'> {
    profileData: any;
    userEmail: string | null;
}

export const AuthenticatedForm = ({
    items,
    total,
    customerInfo,
    setCustomerInfo,
    isSubmitting,
    handleConfirm,
    onCancel,
    isCustomerInfoValid,
    profileData,
    userEmail,
}: AuthenticatedFormProps) => {
    const handleInfoChange = createInfoChangeHandler('address', setCustomerInfo);

    return (
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
                            {profileData?.name || userEmail?.split('@')[0]}
                        </span>
                    </div>
                    {profileData?.phone && (
                        <div className="flex items-center gap-2 mb-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{profileData.phone}</span>
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
                        onChange={handleInfoChange}
                        required
                        className="min-h-[80px] w-full resize-none"
                    />
                </div>
            </div>

            <DialogFooter className="flex items-center justify-between mt-4">
                <Button variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button
                    onClick={handleConfirm}
                    disabled={isSubmitting || !isCustomerInfoValid()}
                    className="gap-1"
                >
                    <MessageCircle className="w-4 h-4" />
                    {isSubmitting ? 'Processing...' : 'Confirm Order'}
                </Button>
            </DialogFooter>
        </>
    );
};
