import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, MessageCircle, Download } from "lucide-react";
import { ExtendedOrder } from "@/types/order";
import { formatOrderId, formatOrderCurrency } from "@/lib/utils";
import { updateOrderStatus } from "@/app/actions/orderActions";
import { calculateOrderTotals } from "@/utils/orders/orderCalculations";
import { toast } from "sonner";

export const columns: ColumnDef<ExtendedOrder>[] = [
  {
    accessorKey: "id",
    header: "Order ID",
    cell: ({ row }) => (
      <div>{row.original.display_id || formatOrderId(row.original.id)}</div>
    ),
    enableGlobalFilter: true,
  },
  {
    id: "profile_name",
    header: "Customer",
    accessorFn: (row) => {
      // Prioritize guest information over profile information
      if (row.is_guest_order) {
        return row.guest_name ? `Guest: ${row.guest_name}` : "Online Guest";
      }
      // Fallback to profile information
      if (row.profiles?.name) return row.profiles.name;
      if (row.profiles?.email) return row.profiles.email;
      if (row.profiles?.phone) return row.profiles.phone;
      return "Unknown Customer";
    },
    cell: ({ row }) => {
      // Prioritize guest information over profile information
      const order = row.original;
      if (order.is_guest_order) {
        return order.guest_name ? `Guest: ${order.guest_name}` : "Online Guest";
      }
      // Fallback to profile information
      const profile = order.profiles;
      if (profile?.name) return profile.name;
      if (profile?.email) return profile.email;
      if (profile?.phone) return profile.phone;
      return "Unknown Customer";
    },
    enableGlobalFilter: true,
  },
  {
    accessorKey: "status",
    header: () => <div className="text-right">Status</div>,
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <div className="text-right">
          <Badge
            variant={
              status === "completed"
                ? "default"
                : status === "pending"
                  ? "secondary"
                  : "destructive"
            }
          >
            {status}
          </Badge>
        </div>
      );
    },
    enableGlobalFilter: true,
  },
  {
    accessorKey: "total_amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      // Use universal calculator to ensure consistent total calculation
      const { totalAmount } = calculateOrderTotals(row.original);
      return (
        <div className="text-right font-medium">
          {formatOrderCurrency(totalAmount)}
        </div>
      );
    },
    enableGlobalFilter: true,
  },
  {
    accessorKey: "created_at",
    header: () => <div className="text-right">Date</div>,
    cell: ({ row }) => (
      <div className="text-right">
        {new Date(row.original.created_at || "").toLocaleDateString()}
      </div>
    ),
    enableGlobalFilter: true,
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const meta = table.options.meta as {
        onDelete: (id: string) => Promise<void>;
        onSelect: (id: string) => void;
        handleActionClick?: (
          e: React.MouseEvent,
          id: string,
          action: string
        ) => void;
      };

      const handleStatusUpdate = async (
        e: React.MouseEvent,
        status: string
      ) => {
        e.stopPropagation(); // Prevent row click
        try {
          const result = await updateOrderStatus(row.original.id, status);
          if (result.success) {
            toast.success("Order status updated successfully");
          } else {
            toast.error("Failed to update order status");
          }
        } catch (error) {
          toast.error("Error updating order status");
        }
      };

      const handleDownloadInvoice = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click
        try {
          const order = row.original;

          // Get customer data from available fields  
          const customerName = order.is_guest_order
            ? (order.guest_name || 'Online Guest')
            : (order.profiles?.name || order.profiles?.email || 'Customer');
          const customerEmail = order.is_guest_order
            ? (order.guest_email || '')
            : (order.profiles?.email || '');
          const customerPhone = order.is_guest_order
            ? (order.guest_phone || '')
            : (order.profiles?.phone || '');

          // Format order items for invoice using universal calculation
          const { subtotal, deliveryCost, discountAmount, totalAmount, items } = calculateOrderTotals(order);

          const invoiceData = {
            orderId: order.display_id || order.id,
            customerName,
            customerEmail,
            customerPhone,
            orderDate: new Date(order.created_at || Date.now()).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            orderTime: new Date(order.created_at || Date.now()).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }),
            status: order.status,
            items: items.map(item => ({
              name: item.name,
              quantity: `${Math.round(item.quantity * 1000)}`, // Convert back to grams for display
              price: item.totalPrice
            })),
            subtotal,
            shippingFee: deliveryCost,
            discount: discountAmount,
            totalAmount
          };

          console.log('Generating PDF invoice for order:', invoiceData.orderId);

          // Call the PDF generation API
          const response = await fetch('/api/generate-invoice-pdf', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies for authentication
            body: JSON.stringify(invoiceData),
          });

          console.log('PDF API Response status:', response.status);
          console.log('PDF API Response headers:', Object.fromEntries(response.headers.entries()));

          if (!response.ok) {
            const errorText = await response.text();
            console.error('PDF API Error Response:', errorText);
            throw new Error(`Failed to generate PDF invoice: ${response.status} ${errorText}`);
          }

          const result = await response.json();

          if (result.success && result.pdfBase64) {
            // Create download link
            const link = document.createElement('a');
            link.href = `data:${result.contentType};base64,${result.pdfBase64}`;
            link.download = result.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success("Invoice downloaded successfully!");
          } else {
            throw new Error(result.error || 'Failed to generate PDF');
          }

        } catch (error) {
          console.error('Error downloading invoice:', error);
          toast.error(`Failed to download invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      };

      const handleWhatsAppInvoice = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click
        try {
          const order = row.original;

          // Get customer data from available fields (updated to use correct structure)
          const customerPhone = order.is_guest_order
            ? (order.guest_phone || '')
            : (order.profiles?.phone || '');
          const customerName = order.is_guest_order
            ? (order.guest_name || 'Online Guest')
            : (order.profiles?.name || order.profiles?.email || 'Customer');
          const customerEmail = order.is_guest_order
            ? (order.guest_email || '')
            : (order.profiles?.email || '');

          console.log('Order data for WhatsApp:', {
            orderId: order.id,
            isGuest: order.is_guest_order,
            customerPhone,
            customerName,
            hasOrderItems: !!(order.order_items && order.order_items.length > 0)
          });

          // Check if we have a phone number
          if (!customerPhone) {
            toast.error("Customer phone number not found for this order. Please update the customer's profile with a phone number.");
            return;
          }

          // Format order items for invoice using universal calculation
          const { subtotal, deliveryCost, discountAmount, totalAmount, items } = calculateOrderTotals(order);

          const invoiceData = {
            customerPhone,
            customerName,
            orderId: order.display_id || order.id,
            items: items.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.totalPrice
            })),
            subtotal,
            shippingFee: deliveryCost,
            discount: discountAmount,
            totalAmount,
            paymentMethod: 'Cash on Delivery',
            transactionDate: new Date(order.created_at || Date.now()).toLocaleDateString(),
            storeName: 'Betty Organic',
            storeContact: '+251944113998'
          };

          console.log('Preparing invoice for manual WhatsApp sharing:', invoiceData);

          // Create manual WhatsApp message
          const whatsappText = `
🌿 *Betty's Organic Store* 🌿
📋 *Invoice*

📅 *Date:* ${invoiceData.transactionDate}
🔢 *Order ID:* ${invoiceData.orderId}
👤 *Customer:* ${invoiceData.customerName}

📝 *Items:*
${invoiceData.items.map(item =>
            `• ${item.name} (${item.quantity}g) - ETB ${item.price.toFixed(2)}`
          ).join('\n')}

💰 *Summary:*
• Subtotal: ETB ${invoiceData.subtotal.toFixed(2)}
• Delivery: ETB ${invoiceData.shippingFee.toFixed(2)}
• Discount: ETB ${invoiceData.discount.toFixed(2)}
• *Total: ETB ${invoiceData.totalAmount.toFixed(2)}*

💳 *Payment:* ${invoiceData.paymentMethod}
📍 *Store:* Genet Tower, Office #505
📞 *Contact:* ${invoiceData.storeContact}

✨ Thank you for choosing Betty Organic! ✨
          `.trim();

          // Open WhatsApp with pre-filled message
          const targetPhone = invoiceData.customerPhone?.replace('+', '') || '251944113998';
          const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(whatsappText)}`;
          window.open(whatsappUrl, '_blank');

          toast.success("Invoice prepared for WhatsApp sharing", {
            description: "WhatsApp opened with invoice message"
          });
        } catch (error) {
          toast.error("Error sending WhatsApp invoice");
          console.error("WhatsApp invoice error:", error);
        }
      };

      const handleClick = (e: React.MouseEvent, action: string) => {
        e.stopPropagation(); // Prevent the row click event

        if (meta.handleActionClick) {
          meta.handleActionClick(e, row.original.id, action);
        } else {
          // Fallback to old behavior if handleActionClick is not provided
          if (action === "view") {
            meta.onSelect(row.original.id);
          } else if (action === "delete") {
            meta.onDelete(row.original.id);
          }
        }
      };

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => e.stopPropagation()} // Prevent row click
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={(e) => handleClick(e, "view")}>
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleWhatsAppInvoice}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Send Invoice via WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadInvoice}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF Invoice
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Update Status</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={(e) => handleStatusUpdate(e, "pending")}
              >
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => handleStatusUpdate(e, "processing")}
              >
                Processing
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => handleStatusUpdate(e, "completed")}
              >
                Completed
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => handleStatusUpdate(e, "cancelled")}
              >
                Cancelled
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => handleClick(e, "delete")}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    enableGlobalFilter: false,
  },
];
