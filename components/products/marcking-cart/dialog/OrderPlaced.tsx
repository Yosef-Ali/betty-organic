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
import { LogIn, ShoppingBag, MessageCircle, CheckCircle } from "lucide-react";
import { OrderDetails, CustomerInfo } from "./types";
import { useMarketingCartStore } from "@/store/cartStore";
import { processMarketingOrder } from "@/app/actions/marketing-actions";

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
    const [autoNotificationSent, setAutoNotificationSent] = useState(false);
    const [notificationStatus, setNotificationStatus] = useState<'pending' | 'sent' | 'failed' | 'manual'>('pending');
    const { setContinuingShopping } = useMarketingCartStore();

    // Automatically send WhatsApp notification when order is placed
    useEffect(() => {
        const sendAutoNotification = async () => {
            if (!autoNotificationSent && orderDetails && customerInfo) {
                console.log('🚀 Sending automatic WhatsApp notification for order:', orderDetails.display_id);
                setNotificationStatus('pending');

                try {
                    const result = await processMarketingOrder({
                        items: orderDetails.items.map(item => ({
                            name: item.name,
                            grams: item.grams,
                            price: item.price
                        })),
                        customer: {
                            name: orderDetails.customer_name || customerInfo.name,
                            phone: orderDetails.customer_phone || customerInfo.phone,
                            email: orderDetails.customer_email || '',
                            address: orderDetails.delivery_address || customerInfo.address
                        },
                        total: orderDetails.total,
                        display_id: orderDetails.display_id
                    });

                    if (result.success && result.notificationSent) {
                        setNotificationStatus('sent');
                        console.log('✅ Automatic notification sent successfully via', result.notificationMethod);
                    } else {
                        setNotificationStatus('manual');
                        console.log('⚠️ Automatic notification failed, fallback to manual mode');
                    }
                } catch (error) {
                    console.error('❌ Auto-notification error:', error);
                    setNotificationStatus('failed');
                }

                setAutoNotificationSent(true);
            }
        };

        // Send notification after a small delay to ensure component is fully mounted
        const timer = setTimeout(sendAutoNotification, 500);
        return () => clearTimeout(timer);
    }, [orderDetails, customerInfo, autoNotificationSent]);

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


    if (!isAuthenticated) {
        // Guest order complete view
        const handleShareWhatsApp = async () => {
            try {
                // Generate the image first - get order receipt content if modal is not open
                let receiptElement = document.querySelector('#receipt-content') as HTMLElement;
                
                // If receipt modal is not open, we need to create a temporary receipt
                if (!receiptElement) {
                    // Create a temporary receipt element
                    const tempDiv = document.createElement('div');
                    tempDiv.id = 'temp-receipt-content';
                    tempDiv.style.position = 'absolute';
                    tempDiv.style.left = '-9999px';
                    tempDiv.style.backgroundColor = '#ffffff';
                    tempDiv.style.color = '#000000';
                    tempDiv.style.padding = '24px';
                    tempDiv.style.width = '400px';
                    tempDiv.style.border = '1px solid #e5e7eb';
                    tempDiv.style.borderRadius = '8px';
                    tempDiv.innerHTML = `
                        <div style="text-center; margin-bottom: 24px;">
                            <h2 style="font-size: 24px; font-weight: bold; color: #000000; margin-bottom: 8px;">Betty Organic</h2>
                            <p style="font-size: 14px; color: #666666; margin-bottom: 4px;">Fresh Organic Fruits & Vegetables</p>
                            <p style="font-size: 12px; color: #666666;">Thank you for your order!</p>
                        </div>
                        <div style="margin-bottom: 24px; text-align: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
                            <p style="font-size: 14px; font-weight: 500; color: #000000; margin-bottom: 4px;">Customer: ${orderDetails.customer_name}</p>
                            <p style="font-size: 12px; color: #666666;">Order ID: ${orderDetails.display_id}</p>
                        </div>
                        <div style="margin-bottom: 24px;">
                            <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #000000;">Order Items:</h3>
                            <div style="space-y: 8px;">
                                ${orderDetails.items.map(item => `
                                    <div style="display: flex; justify-content: space-between; font-size: 14px; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px; margin-bottom: 8px;">
                                        <span style="color: #000000;">${item.name} (${item.grams}g)</span>
                                        <span style="font-weight: 500; color: #000000;">ETB ${item.price.toFixed(2)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; margin-bottom: 24px; border-top: 2px solid #000000; padding-top: 12px;">
                            <span style="color: #000000;">Total Amount:</span>
                            <span style="color: #000000;">ETB ${orderDetails.total.toFixed(2)}</span>
                        </div>
                        <div style="text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #f3f4f6; padding-top: 16px;">
                            <p style="font-weight: 500; margin-bottom: 4px;">Order Details</p>
                            <p>Date: ${new Date().toLocaleDateString()}</p>
                            <p>Time: ${new Date().toLocaleTimeString()}</p>
                            <p style="margin-top: 12px; color: #16a34a; font-weight: 500;">🌿 Fresh • Organic • Healthy 🌿</p>
                        </div>
                    `;
                    document.body.appendChild(tempDiv);
                    receiptElement = tempDiv;
                }

                const html2canvas = (await import('html2canvas')).default;
                
                const canvas = await html2canvas(receiptElement, {
                    backgroundColor: '#ffffff',
                    scale: 3,
                    useCORS: true,
                    allowTaint: false
                });

                // Clean up temporary element
                const tempElement = document.querySelector('#temp-receipt-content');
                if (tempElement) {
                    document.body.removeChild(tempElement);
                }

                // Convert to blob
                const blob = await new Promise<Blob>((resolve) => {
                    canvas.toBlob((blob) => resolve(blob!), 'image/png', 1.0);
                });

                const file = new File([blob], `betty-organic-order-${orderDetails.display_id}.png`, {
                    type: 'image/png'
                });

                // Simple share text for receipt
                const shareText = `🛍️ Betty Organics Order #${orderDetails.display_id}\n\n💰 Total: ${orderDetails.total.toFixed(2)} ETB\n📧 Thank you for your order!`;

                // Always try native device sharing first - works with ALL apps user has
                if (navigator.share) {
                    // Try with image first
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            title: 'Betty Organic Order Receipt',
                            text: shareText,
                            files: [file]
                        });
                    } else {
                        // Fallback to text-only native sharing
                        await navigator.share({
                            title: 'Betty Organic Order Receipt',
                            text: shareText
                        });
                    }
                } else {
                    // If no native sharing, just download the image
                    const link = document.createElement('a');
                    link.download = `betty-organic-order-${orderDetails.display_id}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    
                    alert('Order receipt image downloaded! You can now share it using any app you prefer.');
                }

                console.log(`✅ Order receipt image shared successfully!`);
            } catch (error) {
                console.error('Error sharing order receipt image:', error);
                alert('Sharing not available. Please try again or use the print option.');
            }
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
                            <path
                                d="M20 6L9 17l-5-5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        Order Submitted Successfully!
                    </DialogTitle>
                    <DialogDescription>
                        Your order has been received and our team will contact you soon for confirmation
                    </DialogDescription>

                    {/* Auto-notification status */}
                    <div className="mt-3 flex items-center gap-2 text-sm">
                        {notificationStatus === 'pending' && (
                            <div className="flex items-center gap-2 text-blue-600">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <span>Sending notification to admin...</span>
                            </div>
                        )}
                        {notificationStatus === 'sent' && (
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span>Admin automatically notified via WhatsApp</span>
                            </div>
                        )}
                        {notificationStatus === 'manual' && (
                            <div className="flex items-center gap-2 text-orange-600">
                                <MessageCircle className="w-4 h-4" />
                                <span>Manual notification available below</span>
                            </div>
                        )}
                        {notificationStatus === 'failed' && (
                            <div className="flex items-center gap-2 text-red-600">
                                <MessageCircle className="w-4 h-4" />
                                <span>Auto-notification failed - use manual option</span>
                            </div>
                        )}
                    </div>
                </DialogHeader>

                <div className="my-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center flex-shrink-0">
                            <LogIn className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-medium text-emerald-800 dark:text-emerald-200 mb-1">
                                Want to track your order?
                            </h3>
                            <p className="text-sm text-emerald-700 dark:text-emerald-300 leading-relaxed">
                                Create an account to track this order and enjoy faster checkout on future purchases.
                            </p>
                            <div className="mt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSignInAction}
                                    className="border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900"
                                >
                                    <LogIn className="w-4 h-4 mr-2" />
                                    Create Account Now
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">Order ID:</span>
                        <span className="px-2 py-1 bg-muted rounded text-xs font-mono">{orderDetails.display_id}</span>
                    </div>
                    <div className="text-muted-foreground">
                        <span className="font-medium">What happens next:</span>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>Our team will review and confirm your order</li>
                            <li>We'll contact you shortly with delivery details</li>
                            <li>Your fresh organic products will be delivered soon</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter className="flex flex-col gap-3 mt-6">
                    {/* Action buttons row */}
                    <div className="flex justify-center gap-2">
                        {/* Continue Shopping button */}
                        <Button
                            variant="default"
                            className="flex-1 gap-2 bg-green-600 hover:bg-green-700 h-12"
                            onClick={handleClose}
                        >
                            <ShoppingBag className="w-4 h-4" />
                            Continue Shopping
                        </Button>


                        {/* Manual WhatsApp notification - only show if auto-notification failed or manual mode */}
                        {(notificationStatus === 'manual' || notificationStatus === 'failed') && (
                            <Button
                                variant="outline"
                                className="w-12 h-12 p-0 border-green-600 text-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-950"
                                onClick={handleShareWhatsApp}
                                title={notificationStatus === 'failed' ? "Retry WhatsApp Notification" : "Send Manual WhatsApp Notification"}
                            >
                                <MessageCircle className="w-5 h-5" />
                            </Button>
                        )}

                        {/* Auto-notification successful - show check */}
                        {notificationStatus === 'sent' && (
                            <Button
                                variant="outline"
                                className="w-12 h-12 p-0 border-green-600 text-green-600 cursor-default dark:text-green-400 dark:border-green-400"
                                disabled
                                title="Admin Automatically Notified"
                            >
                                <CheckCircle className="w-5 h-5" />
                            </Button>
                        )}
                    </div>

                    <div className="text-center text-xs text-muted-foreground border-t pt-3">
                        <div className="flex justify-center gap-3">
                            <Button
                                variant="link"
                                size="sm"
                                onClick={handleSignInAction}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-0 h-auto"
                            >
                                Create Account to Track Orders
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </>
        );
    }

    // Signed-in user order complete view
    const handleSignedUserShareWhatsApp = async () => {
        try {
            // Generate the image first - get order receipt content if modal is not open
            let receiptElement = document.querySelector('#receipt-content') as HTMLElement;
            
            // If receipt modal is not open, we need to create a temporary receipt
            if (!receiptElement) {
                // Create a temporary receipt element
                const tempDiv = document.createElement('div');
                tempDiv.id = 'temp-receipt-content';
                tempDiv.style.position = 'absolute';
                tempDiv.style.left = '-9999px';
                tempDiv.style.backgroundColor = '#ffffff';
                tempDiv.style.color = '#000000';
                tempDiv.style.padding = '24px';
                tempDiv.style.width = '400px';
                tempDiv.style.border = '1px solid #e5e7eb';
                tempDiv.style.borderRadius = '8px';
                tempDiv.innerHTML = `
                    <div style="text-center; margin-bottom: 24px;">
                        <h2 style="font-size: 24px; font-weight: bold; color: #000000; margin-bottom: 8px;">Betty Organic</h2>
                        <p style="font-size: 14px; color: #666666; margin-bottom: 4px;">Fresh Organic Fruits & Vegetables</p>
                        <p style="font-size: 12px; color: #666666;">Thank you for your order!</p>
                    </div>
                    <div style="margin-bottom: 24px; text-align: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
                        <p style="font-size: 14px; font-weight: 500; color: #000000; margin-bottom: 4px;">Customer: ${orderDetails.customer_name}</p>
                        <p style="font-size: 12px; color: #666666;">Order ID: ${orderDetails.display_id}</p>
                    </div>
                    <div style="margin-bottom: 24px;">
                        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #000000;">Order Items:</h3>
                        <div style="space-y: 8px;">
                            ${orderDetails.items.map(item => `
                                <div style="display: flex; justify-content: space-between; font-size: 14px; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px; margin-bottom: 8px;">
                                    <span style="color: #000000;">${item.name} (${item.grams}g)</span>
                                    <span style="font-weight: 500; color: #000000;">ETB ${item.price.toFixed(2)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; margin-bottom: 24px; border-top: 2px solid #000000; padding-top: 12px;">
                        <span style="color: #000000;">Total Amount:</span>
                        <span style="color: #000000;">ETB ${orderDetails.total.toFixed(2)}</span>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #f3f4f6; padding-top: 16px;">
                        <p style="font-weight: 500; margin-bottom: 4px;">Order Details</p>
                        <p>Date: ${new Date().toLocaleDateString()}</p>
                        <p>Time: ${new Date().toLocaleTimeString()}</p>
                        <p style="margin-top: 12px; color: #16a34a; font-weight: 500;">🌿 Fresh • Organic • Healthy 🌿</p>
                    </div>
                `;
                document.body.appendChild(tempDiv);
                receiptElement = tempDiv;
            }

            const html2canvas = (await import('html2canvas')).default;
            
            const canvas = await html2canvas(receiptElement, {
                backgroundColor: '#ffffff',
                scale: 3,
                useCORS: true,
                allowTaint: false
            });

            // Clean up temporary element
            const tempElement = document.querySelector('#temp-receipt-content');
            if (tempElement) {
                document.body.removeChild(tempElement);
            }

            // Convert to blob
            const blob = await new Promise<Blob>((resolve) => {
                canvas.toBlob((blob) => resolve(blob!), 'image/png', 1.0);
            });

            const file = new File([blob], `betty-organic-order-${orderDetails.display_id}.png`, {
                type: 'image/png'
            });

            // Simple share text for receipt
            const shareText = `🛍️ Betty Organics Order #${orderDetails.display_id}\n\n💰 Total: ${orderDetails.total.toFixed(2)} ETB\n📧 Thank you for your order!`;

            // Always try native device sharing first - works with ALL apps user has
            if (navigator.share) {
                // Try with image first
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: 'Betty Organic Order Receipt',
                        text: shareText,
                        files: [file]
                    });
                } else {
                    // Fallback to text-only native sharing
                    await navigator.share({
                        title: 'Betty Organic Order Receipt',
                        text: shareText
                    });
                }
            } else {
                // If no native sharing, just download the image
                const link = document.createElement('a');
                link.download = `betty-organic-order-${orderDetails.display_id}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                
                alert('Order receipt image downloaded! You can now share it using any app you prefer.');
            }

            console.log(`✅ Order receipt image shared successfully!`);
        } catch (error) {
            console.error('Error sharing order receipt image:', error);
            alert('Sharing not available. Please try again or use the print option.');
        }
    };

    // Add a better post-order experience for signed-in users as well
    const renderAuthenticatedOrderComplete = () => (
        <>
            <DialogHeader>
                <DialogTitle className="text-green-600 flex items-center gap-2">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Order Confirmed Successfully!
                </DialogTitle>
                <DialogDescription>
                    Your order has been saved and our team has been notified
                </DialogDescription>
            </DialogHeader>

            {/* Success message and order tracking info */}
            <div className="my-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-medium text-emerald-800 dark:text-emerald-200 mb-1">
                            Your order is being processed
                        </h3>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300 leading-relaxed">
                            You can track your order status in the dashboard. We'll keep you updated on delivery progress.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                    <span className="font-medium">Order ID:</span>
                    <span className="px-2 py-1 bg-muted rounded text-xs font-mono">{orderDetails.display_id}</span>
                </div>            <div className="text-muted-foreground">
                    <span className="font-medium">Order Status:</span>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Order confirmed and being processed</li>
                        <li>You'll receive updates on delivery progress</li>
                        <li>Fresh organic products prepared with care</li>
                    </ul>
                </div>
            </div>

            <DialogFooter className="flex flex-col gap-3 mt-6">
                {/* Action buttons row */}
                <div className="flex justify-center gap-2">
                    {/* Continue Shopping button */}
                    <Button
                        variant="default"
                        className="flex-1 gap-2 bg-green-600 hover:bg-green-700 h-12"
                        onClick={handleClose}
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Continue Shopping
                    </Button>
                    {/* Manual WhatsApp notification - only show if auto-notification failed or manual mode */}
                    {(notificationStatus === 'manual' || notificationStatus === 'failed') && (
                        <Button
                            variant="outline"
                            className="w-12 h-12 p-0 border-green-600 text-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-950"
                            onClick={handleSignedUserShareWhatsApp}
                            title={notificationStatus === 'failed' ? "Retry WhatsApp Notification" : "Send Manual WhatsApp Notification"}
                        >
                            <MessageCircle className="w-5 h-5" />
                        </Button>
                    )}
                </div>

            </DialogFooter>
        </>
    );

    // Update the main return statement to use the new authenticated view
    return isAuthenticated ? renderAuthenticatedOrderComplete() : (
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

                {/* Auto-notification status */}
                <div className="mt-3 flex items-center gap-2 text-sm">
                    {notificationStatus === 'pending' && (
                        <div className="flex items-center gap-2 text-blue-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span>Sending notification to admin...</span>
                        </div>
                    )}
                    {notificationStatus === 'sent' && (
                        <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>Admin automatically notified via WhatsApp</span>
                        </div>
                    )}
                    {notificationStatus === 'manual' && (
                        <div className="flex items-center gap-2 text-orange-600">
                            <MessageCircle className="w-4 h-4" />
                            <span>Manual notification available below</span>
                        </div>
                    )}
                    {notificationStatus === 'failed' && (
                        <div className="flex items-center gap-2 text-red-600">
                            <MessageCircle className="w-4 h-4" />
                            <span>Auto-notification failed - use manual option</span>
                        </div>
                    )}
                </div>
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


                    {/* Manual WhatsApp notification - only show if auto-notification failed or manual mode */}
                    {(notificationStatus === 'manual' || notificationStatus === 'failed') && (
                        <Button
                            variant="outline"
                            className="w-12 h-12 p-0 border-green-600 text-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-950"
                            onClick={handleSignedUserShareWhatsApp}
                            title={notificationStatus === 'failed' ? "Retry WhatsApp Notification" : "Send Manual WhatsApp Notification"}
                        >
                            <MessageCircle className="w-5 h-5" />
                        </Button>
                    )}

                    {/* Auto-notification successful - show check */}
                    {notificationStatus === 'sent' && (
                        <Button
                            variant="outline"
                            className="w-12 h-12 p-0 border-green-600 text-green-600 cursor-default dark:text-green-400 dark:border-green-400"
                            disabled
                            title="Admin Automatically Notified"
                        >
                            <CheckCircle className="w-5 h-5" />
                        </Button>
                    )}
                </div>
            </DialogFooter>

        </>
    );
}
