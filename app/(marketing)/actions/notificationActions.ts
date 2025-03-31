'use server';

import { CartItemType } from "@/types/cart";

interface OrderDetails {
  id: string | number;
  display_id?: string; // Optional, fallback to id if not provided
  items: {
    name: string;
    grams: number;
    price: number;
    unit_price?: number; // Optional price per kg
  }[];
  total: number;
  created_at?: string;
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
}

const ADMIN_WHATSAPP_NUMBER = process.env.ADMIN_WHATSAPP_NUMBER || 'YOUR_ADMIN_WHATSAPP_NUMBER';

export async function sendWhatsAppOrderNotification(orderDetails: OrderDetails): Promise<void> {
  try {
    console.log("Attempting to send WhatsApp notification for order:", orderDetails.id);

    const formattedDate = orderDetails.created_at
      ? new Date(orderDetails.created_at).toLocaleString('en-ET', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
      : new Date().toLocaleString('en-ET', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });

    const messageItems = orderDetails.items
      .map(item => {
        const unitPrice = item.unit_price
          ? ` (ETB ${item.unit_price}/kg)`
          : '';
        return `• ${item.name}${unitPrice}\n  ${item.grams}g - ETB ${item.price.toFixed(2)}`;
      })
      .join('\n');

    // Use display_id if available, otherwise format the regular id
    const orderReference = orderDetails.display_id || `ORD${String(orderDetails.id).padStart(6, '0')}`;

    const message = `🛍️ *New Order ${orderReference}*
📅 ${formattedDate}

📋 *Order Details:*
${messageItems}

💰 *Total Amount:* ETB ${orderDetails.total.toFixed(2)}

${orderDetails.customer_name ? `👤 *Customer:* ${orderDetails.customer_name}` : '👤 *Customer:* Guest'}
${orderDetails.customer_phone ? `📞 *Phone:* ${orderDetails.customer_phone}` : ''}
${orderDetails.delivery_address ? `📍 *Delivery:* ${orderDetails.delivery_address}` : ''}

🔔 *Action Required:* Please prepare this order for delivery.

#Order${orderReference.replace(/[^0-9]/g, '')}`;

    // --- Placeholder for actual WhatsApp API call ---
    console.log(`--- Sending to ${ADMIN_WHATSAPP_NUMBER} ---`);
    console.log(message);
    console.log("--- End of WhatsApp Simulation ---");

    // Example using a WhatsApp API client:
    // try {
    //   const response = await whatsAppClient.sendMessage({
    //     to: ADMIN_WHATSAPP_NUMBER,
    //     body: message,
    //   });
    //   console.log("WhatsApp notification sent successfully:", response);
    // } catch (error) {
    //   console.error("Error sending WhatsApp notification:", error);
    //   throw new Error("Failed to send WhatsApp notification.");
    // }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

  } catch (error) {
    console.error("Error in sendWhatsAppOrderNotification:", error);
    throw error instanceof Error ? error : new Error("Failed to send WhatsApp notification");
  }
}
