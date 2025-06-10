"use client";

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
import { Share2, MapPin, User, Phone, LogIn, ShoppingCart } from "lucide-react";
import { createInfoChangeHandler } from "./utils";
import { GuestFormProps } from "./types";

export const GuestForm = ({
    items,
    total,
    customerInfo,
    setCustomerInfo,
    isSubmitting,
    handleConfirm,
    handleSignIn,
    handleDirectOrder,
    onCancel,
    isCustomerInfoValid,
}: GuestFormProps) => {
    const handleNameChange = createInfoChangeHandler('name', setCustomerInfo);
    const handlePhoneChange = createInfoChangeHandler('phone', setCustomerInfo);
    const handleAddressChange = createInfoChangeHandler('address', setCustomerInfo);

    return (
        <>
            <DialogHeader>
                <DialogTitle>Order Details</DialogTitle>
                <DialogDescription>
                    Review your order and provide contact details
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

            {/* Contact & Delivery Info */}
            <div className="rounded-lg border p-3 space-y-4">
                <h3 className="font-medium text-sm">Contact & Delivery Details</h3>

                <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">Your Name (optional)</span>
                    </Label>
                    <Input
                        id="name"
                        placeholder="Enter your name"
                        value={customerInfo.name}
                        onChange={handleNameChange}
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">Phone Number*</span>
                    </Label>
                    <Input
                        id="phone"
                        placeholder="e.g., 0911234567"
                        value={customerInfo.phone}
                        onChange={handlePhoneChange}
                        required
                        className="w-full"
                    />
                    <p className="text-xs text-gray-500 break-words">
                        Ethiopian format: 09XXXXXXXX or +251XXXXXXXXX
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="address" className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">Delivery Address*</span>
                    </Label>
                    <Textarea
                        id="address"
                        placeholder="Enter your delivery address"
                        value={customerInfo.address}
                        onChange={handleAddressChange}
                        required
                        className="min-h-[80px] w-full resize-none"
                    />
                </div>
            </div>

            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700 flex items-center gap-2 flex-wrap">
                    <ShoppingCart className="w-4 h-4 flex-shrink-0" />
                    <span className="break-words font-medium">
                        Choose how to complete your order
                    </span>
                </p>
                <p className="text-xs text-blue-600 mt-1 pl-6">
                    Submit directly to our system or share via WhatsApp for personal assistance
                </p>
            </div>

            <DialogFooter className="flex flex-col gap-3 mt-4">
                <div className="flex items-center justify-between w-full">
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>

                    {handleSignIn && (
                        <Button
                            variant="outline"
                            onClick={handleSignIn}
                            className="gap-1"
                            size="sm"
                        >
                            <LogIn className="w-4 h-4" />
                            Sign in
                        </Button>
                    )}
                </div>

                <div className="flex gap-2 w-full">
                    {handleDirectOrder && (
                        <Button
                            onClick={handleDirectOrder}
                            disabled={isSubmitting || !isCustomerInfoValid()}
                            className="gap-1 flex-1"
                            variant="default"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            {isSubmitting ? 'Processing...' : 'Submit Order'}
                        </Button>
                    )}
                    <Button
                        onClick={handleConfirm}
                        disabled={isSubmitting || !isCustomerInfoValid()}
                        className="gap-1 flex-1"
                        variant="outline"
                    >
                        <Share2 className="w-4 h-4" />
                        {isSubmitting ? 'Processing...' : 'Share on WhatsApp'}
                    </Button>
                </div>
            </DialogFooter>
        </>
    );
};
