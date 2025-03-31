'use server';

interface OrderDetails {
  id: string | number;
  display_id?: string;
  items: {
    name: string;
    grams: number;
    price: number;
    unit_price?: number;
  }[];
  total: number;
  created_at?: string;
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
}

const ADMIN_WHATSAPP_NUMBER = process.env.ADMIN_WHATSAPP_NUMBER || '251947385509';

export async function sendWhatsAppOrderNotification(orderDetails: OrderDetails): Promise<void> {
  try {
    console.log("Preparing WhatsApp notification for order:", orderDetails.display_id || orderDetails.id);

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
        return `• *${item.name}*${unitPrice}\n  ${item.grams}g - ETB ${item.price.toFixed(2)}`;
      })
      .join('\n');

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

    // Format the phone number
    const cleanPhoneNumber = ADMIN_WHATSAPP_NUMBER.replace(/\D/g, '');
    const formattedPhone = cleanPhoneNumber.startsWith('251')
      ? cleanPhoneNumber
      : `251${cleanPhoneNumber.replace(/^0/, '')}`;

    // Create WhatsApp URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

    // Log the message for verification
    console.log("WhatsApp Message Preview:");
    console.log(message);
    console.log("\nWhatsApp Link:");
    console.log(whatsappUrl);

    // Return the WhatsApp URL for client-side handling
    return Promise.resolve();

  } catch (error) {
    console.error("Error preparing WhatsApp notification:", error);
    throw error instanceof Error ? error : new Error("Failed to prepare WhatsApp notification");
  }
}
