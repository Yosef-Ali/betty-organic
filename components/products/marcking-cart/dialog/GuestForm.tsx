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
            <ScrollArea className="max-h-[180px] mt-4 mb-4 border rounded-lg p-3 bg-gray-50">
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
            <div className="rounded-lg border p-4 space-y-4 bg-white">
                <h3 className="font-medium text-base text-gray-800 border-b pb-2">Contact & Delivery Details</h3>

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
                        placeholder="Enter your complete delivery address with landmarks"
                        value={customerInfo.address}
                        onChange={handleAddressChange}
                        required
                        className="min-h-[60px] max-h-[100px] w-full resize-none text-sm"
                    />
                </div>
            </div>

            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 flex items-center gap-2 font-medium mb-2">
                    <ShoppingCart className="w-4 h-4 flex-shrink-0" />
                    Choose how to complete your order
                </p>
                <p className="text-xs text-blue-600 leading-relaxed">
                    Submit directly to our system or share via WhatsApp for personal assistance
                </p>
            </div>

            <DialogFooter className="flex flex-col gap-3 mt-6 pt-4 border-t">
                <div className="flex items-center justify-between w-full">
                    <Button variant="outline" onClick={onCancel} size="sm">
                        Cancel
                    </Button>

                    {handleSignIn && (
                        <Button
                            variant="outline"
                            onClick={handleSignIn}
                            className="gap-1"
                            size="sm"
                        >
                            <LogIn className="w-3 h-3" />
                            <span className="hidden sm:inline">Sign in</span>
                        </Button>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full">
                    {handleDirectOrder && (
                        <Button
                            onClick={handleDirectOrder}
                            disabled={isSubmitting || !isCustomerInfoValid()}
                            className="gap-2 flex-1 h-11"
                            variant="default"
                        >
                            <ShoppingCart className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm font-medium">
                                {isSubmitting ? 'Processing...' : 'Submit Order'}
                            </span>
                        </Button>
                    )}
                    <Button
                        onClick={handleConfirm}
                        disabled={isSubmitting || !isCustomerInfoValid()}
                        className="gap-2 flex-1 h-11"
                        variant="outline"
                    >
                        <Share2 className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">
                            {isSubmitting ? 'Processing...' : 'Share on WhatsApp'}
                        </span>
                    </Button>
                </div>
            </DialogFooter>
        </>
    );
};
