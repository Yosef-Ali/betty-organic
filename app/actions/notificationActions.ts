'use server';

import { CartItemType } from "@/types/cart";
import { createClient } from '@/lib/supabase/server';

// Define a type for the order details expected by the notification function
interface OrderDetails {
  id: number;
  items: { name: string; grams: number; price: number }[];
  total: number;
  // Add optional customer info if needed
  // customerName?: string;
  // customerPhone?: string;
}

// Replace this with your actual WhatsApp API integration (e.g., Twilio, Meta API)
const ADMIN_WHATSAPP_NUMBER = process.env.ADMIN_WHATSAPP_NUMBER || 'YOUR_ADMIN_WHATSAPP_NUMBER'; // Store admin number securely

export async function sendWhatsAppOrderNotification(orderDetails: OrderDetails): Promise<void> {
  console.log("Attempting to send WhatsApp notification for order:", orderDetails.id);

  const messageItems = orderDetails.items
    .map(item => `- ${item.name} (${item.grams}g): ETB ${item.price.toFixed(2)}`)
    .join('\n');

  const message = `🎉 New Order Received! 🎉

Order ID: #${orderDetails.id}
Total Amount: ETB ${orderDetails.total.toFixed(2)}

Items:
${messageItems}

---
Please prepare the order for delivery.`;
  // Customer Info (if available):
  // Name: ${orderDetails.customerName || 'Guest'}
  // Phone: ${orderDetails.customerPhone || 'N/A'}


  // --- Placeholder for actual WhatsApp API call ---
  console.log(`--- Sending to ${ADMIN_WHATSAPP_NUMBER} ---`);
  console.log(message);
  console.log("--- End of WhatsApp Simulation ---");

  // Example using a hypothetical WhatsApp API client:
  // try {
  //   const response = await whatsAppClient.sendMessage({
  //     to: ADMIN_WHATSAPP_NUMBER,
  //     body: message,
  //   });
  //   console.log("WhatsApp notification sent successfully:", response);
  // } catch (error) {
  //   console.error("Error sending WhatsApp notification:", error);
  //   throw new Error("Failed to send WhatsApp notification."); // Re-throw to be caught in the dialog
  // }
  // --- End Placeholder ---

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // For now, we just resolve successfully after logging
  return Promise.resolve();
}

/**
 * Fetches pending orders for notifications
 * @returns Array of pending orders
 */
export async function getPendingOrders() {
  try {
    const supabase = await createClient();

    // Fetch pending orders
    const { data, error, count } = await supabase
      .from('orders')
      .select('id, status, created_at, total_amount, profiles!orders_profile_id_fkey(*)', {
        count: 'exact',
      })
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching pending orders:', error);
      throw error;
    }

    return {
      orders: data || [],
      count: count || 0
    };
  } catch (error) {
    console.error('Failed to fetch pending orders:', error);
    return {
      orders: [],
      count: 0
    };
  }
}

/**
 * Creates a test pending order
 * @param userId The user ID to associate with the order
 * @returns The created order
 */
export async function createTestPendingOrder(userId: string) {
  try {
    const supabase = await createClient();

    // Create a test order
    const { data, error } = await supabase
      .from('orders')
      .insert({
        profile_id: userId,
        customer_profile_id: userId,
        total_amount: 99.99,
        status: 'pending',
        type: 'test',
        display_id: `TEST-${Date.now().toString().slice(-6)}`,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating test order:', error);
      throw error;
    }

    return {
      success: true,
      order: data
    };
  } catch (error) {
    console.error('Failed to create test order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
