import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Barcode from "react-barcode";
import { Printer, MessageCircle, Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import { ExtendedOrder } from "@/types/order";

interface OrderInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: ExtendedOrder | null;
}

export const OrderInvoiceModal: React.FC<OrderInvoiceModalProps> = ({
    isOpen,
    onClose,
    order,
}) => {
    const [isSending, setIsSending] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    if (!order) return null;

    // Calculate order details
    const customerName = order.is_guest_order
        ? (order.guest_name ? `Guest: ${order.guest_name}` : "Online Guest")
        : (order.customer?.name || order.profiles?.name || "Unknown Customer");

    const customerEmail = order.customer?.email || order.guest_email || "";
    const customerPhone = order.customer?.phone || order.guest_phone || "";

    const orderItems = order.order_items?.map((item: any) => ({
        name: item.product_name || item.name || "Unknown Product",
        quantity: item.quantity || 0,
        price: (item.price || 0) * (item.quantity || 1),
    })) || [];

    const orderId = order.display_id || order.id;
    const orderDate = new Date(order.created_at || Date.now());

    const handlePrint = () => {
        window.print();
    };

    const generateWhatsAppText = () => {
        const dateStr = orderDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const timeStr = orderDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        let text = `🧾 *Betty Organic - Order Receipt*\n`;
        text += `🌿 Fresh Organic Fruits & Vegetables 🌿\n`;
        text += `${'═'.repeat(35)}\n\n`;

        text += `👤 *Customer:* ${customerName}\n`;
        text += `📋 *Order ID:* ${orderId}\n`;
        text += `📅 *Date:* ${dateStr}\n`;
        text += `⏰ *Time:* ${timeStr}\n\n`;

        text += `${'─'.repeat(35)}\n`;
        text += `🛒 *ORDER ITEMS*\n`;
        text += `${'─'.repeat(35)}\n`;

        orderItems.forEach((item, index) => {
            text += `${index + 1}. *${item.name}*\n`;
            text += `   📏 ${(item.quantity * 1000).toFixed(0)}g\n`;
            text += `   💰 ETB ${item.price.toFixed(2)}\n\n`;
        });

        text += `${'─'.repeat(35)}\n`;
        text += `💰 *TOTAL: ETB ${(order.total_amount || 0).toFixed(2)}*\n\n`;

        text += `✅ *Order Confirmed!*\n`;
        text += `🚚 We'll prepare your fresh organic produce\n`;
        text += `📞 We'll contact you for delivery coordination\n\n`;

        text += `💚 Thank you for choosing Betty Organic!\n`;
        text += `🌱 Supporting healthy living & sustainable farming`;

        return text;
    };

    const handleSendToCustomer = async () => {
        if (!customerPhone) {
            toast.error("No customer phone number available");
            return;
        }

        setIsSending(true);
        try {
            const receiptText = generateWhatsAppText();
            const cleanPhone = customerPhone.replace(/[\s\-\(\)]/g, '');
            const phoneToUse = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

            const whatsappUrl = `https://wa.me/${phoneToUse.replace('+', '')}?text=${encodeURIComponent(receiptText)}`;
            window.open(whatsappUrl, '_blank');

            toast.success('WhatsApp opened with receipt message');
        } catch (error) {
            console.error('Error opening WhatsApp:', error);
            toast.error('Error opening WhatsApp');
        } finally {
            setIsSending(false);
        }
    };

    const handleSendToAdmin = async () => {
        setIsSending(true);
        try {
            const adminPhone = '251944113998';

            const adminText = `
🌿 *Betty's Organic Store* 🌿
📋 *Order Invoice for Admin*

📅 *Date:* ${orderDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}
⏰ *Time:* ${orderDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            })}
🔢 *Order ID:* ${orderId}
👤 *Customer:* ${customerName}
📞 *Customer Phone:* ${customerPhone || 'Not provided'}
✉️ *Customer Email:* ${customerEmail || 'Not provided'}

📝 *Order Summary:*
${orderItems.map(item =>
                `• ${item.name} (${(item.quantity * 1000).toFixed(0)}g) - ETB ${item.price.toFixed(2)}`
            ).join('\n')}

💰 *Total Amount:* ETB ${(order.total_amount || 0).toFixed(2)}

💳 *Payment Method:* Cash on Delivery
📍 *Store:* Genet Tower, Office #505
📞 *Store Contact:* +251944113998

✨ Ready for processing! ✨
      `.trim();

            const whatsappUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(adminText)}`;
            window.open(whatsappUrl, '_blank');

            toast.success('Admin WhatsApp opened with order details');
        } catch (error) {
            console.error('Error opening admin WhatsApp:', error);
            toast.error('Error opening admin WhatsApp');
        } finally {
            setIsSending(false);
        }
    };

    const handleDownloadPDF = async () => {
        setIsGeneratingPDF(true);
        try {
            const invoiceData = {
                orderId: orderId,
                customerName: customerName,
                customerEmail: customerEmail || 'customer@email.com',
                customerPhone: customerPhone || '',
                orderDate: orderDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                orderTime: orderDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }),
                items: orderItems.map(item => ({
                    name: item.name,
                    quantity: `${Math.round(item.quantity * 1000)}`,
                    price: item.price
                })),
                subtotal: order.total_amount || 0,
                shippingFee: 0,
                discount: 0,
                totalAmount: order.total_amount || 0
            };

            const response = await fetch('/api/generate-invoice-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invoiceData)
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.pdfBase64) {
                    const link = document.createElement('a');
                    link.href = `data:${result.contentType};base64,${result.pdfBase64}`;
                    link.download = result.filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    toast.success("Invoice downloaded successfully!");
                } else {
                    toast.error("Failed to generate PDF invoice");
                }
            } else {
                toast.error("Failed to generate invoice");
            }
        } catch (error) {
            console.error('Error generating invoice:', error);
            toast.error("Error generating invoice");
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    return (
        <>
            {/* Print-only styles */}
            <style>
                {`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-content, .print-content * {
              visibility: visible;
            }
            .print-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white !important;
              color: black !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 20px !important;
              border: none !important;
              box-shadow: none !important;
            }
            .no-print {
              display: none !important;
            }
            @page {
              margin: 0.5in;
              size: auto;
            }
          }
        `}
            </style>

            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[500px] z-[60] bg-white border-border">
                    <DialogHeader className="no-print">
                        <DialogTitle className="text-black">Order Receipt</DialogTitle>
                    </DialogHeader>

                    {/* Printable content - Exact match to your screenshot */}
                    <div id="receipt-content" className="print-content border border-border p-6 rounded bg-white text-black max-w-md mx-auto">
                        {/* Header */}
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold text-black mb-2">Order Receipt</h1>
                            <h2 className="text-xl font-bold text-black mb-1">Betty Organic</h2>
                            <p className="text-sm text-gray-600 mb-1">
                                Fresh Organic Fruits & Vegetables
                            </p>
                            <p className="text-sm text-gray-600">
                                Thank you for your order!
                            </p>
                        </div>

                        {/* Customer Info */}
                        <div className="mb-6 text-center">
                            <p className="text-base font-medium text-black mb-1">
                                Customer: {customerName}
                            </p>
                            {customerEmail && (
                                <p className="text-sm text-gray-600 mb-1">
                                    ({customerEmail})
                                </p>
                            )}
                            <p className="text-sm text-gray-600">Order ID: {orderId}</p>
                        </div>

                        {/* Order Items */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-3 text-black">Order Items:</h3>
                            <div className="space-y-2">
                                {orderItems.map((item, index) => (
                                    <div key={index} className="flex justify-between items-start text-black border-b border-gray-200 pb-2">
                                        <div className="flex-1">
                                            <div className="font-medium">{item.name} ({(item.quantity * 1000).toFixed(0)}g)</div>
                                        </div>
                                        <div className="font-semibold ml-4">
                                            ETB {item.price.toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Total */}
                        <div className="mb-6 border-t-2 border-black pt-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xl font-bold text-black">Total Amount:</span>
                                <span className="text-xl font-bold text-black">ETB {(order.total_amount || 0).toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Barcode */}
                        <div className="flex justify-center mb-6">
                            <div className="bg-white p-2">
                                <Barcode
                                    value={orderId}
                                    width={1.2}
                                    height={40}
                                    fontSize={12}
                                    textAlign="center"
                                    textPosition="bottom"
                                    background="#ffffff"
                                    lineColor="#000000"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center text-sm text-gray-600 border-t border-gray-200 pt-4">
                            <p className="font-medium mb-1">Order Details</p>
                            <p>Date: {orderDate.toLocaleDateString('en-US', {
                                month: 'numeric',
                                day: 'numeric',
                                year: 'numeric'
                            })}</p>
                            <p>Time: {orderDate.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                            })}</p>
                            <p className="mt-3 text-green-600 font-medium">🌿 Fresh • Organic • Healthy 🌿</p>
                        </div>
                    </div>

                    {/* Non-printable controls */}
                    <div className="flex flex-col gap-3 mt-4 no-print">
                        {/* Primary Actions */}
                        <div className="flex justify-center gap-2">
                            <Button onClick={handlePrint} variant="outline" className="gap-2 flex-1">
                                <Printer className="h-4 w-4" />
                                Print
                            </Button>
                            <Button
                                onClick={handleDownloadPDF}
                                disabled={isGeneratingPDF}
                                variant="outline"
                                className="gap-2 flex-1"
                            >
                                <Download className="h-4 w-4" />
                                {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
                            </Button>
                        </div>

                        {/* WhatsApp Actions */}
                        <div className="flex justify-center gap-2">
                            <Button
                                onClick={handleSendToCustomer}
                                disabled={isSending || !customerPhone}
                                className="gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 flex-1 disabled:opacity-50"
                            >
                                <MessageCircle className="h-4 w-4" />
                                {isSending ? 'Opening...' : 'Send to Customer'}
                            </Button>
                            <Button
                                onClick={handleSendToAdmin}
                                disabled={isSending}
                                variant="outline"
                                className="gap-2 flex-1"
                            >
                                <Share2 className="h-4 w-4" />
                                Send to Admin
                            </Button>
                        </div>

                        {/* Status Messages */}
                        {customerPhone ? (
                            <p className="text-xs text-center text-green-600">
                                ✅ Customer phone: {customerPhone}
                            </p>
                        ) : (
                            <p className="text-xs text-center text-amber-600">
                                ⚠️ No customer phone number available
                            </p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default OrderInvoiceModal;
