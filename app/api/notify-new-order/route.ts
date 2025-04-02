import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase'; // Assuming you have this type definition

// Initialize Supabase client with SERVICE ROLE KEY for server-side operations
// Ensure these environment variables are set in your deployment environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Role Key for API route.');
  // Avoid throwing here during build time, handle appropriately at runtime
}

// Define the type for the expected webhook payload (adjust based on your trigger setup)
interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: {
    id: string;
    status: string;
    created_at: string;
    // Add other relevant fields if needed
  };
  // Add 'old_record' if handling UPDATE/DELETE
}

export async function POST(request: Request) {
  // Ensure Supabase client can be initialized
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Server configuration error: Supabase credentials missing.' }, { status: 500 });
  }

  const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);

  try {
    const payload = (await request.json()) as WebhookPayload;
    console.log('Received Supabase webhook payload:', payload);

    // Validate payload structure (basic check)
    if (!payload || payload.type !== 'INSERT' || payload.table !== 'orders' || !payload.record) {
      console.warn('Invalid or non-INSERT payload received:', payload);
      return NextResponse.json({ message: 'Payload ignored: Not a valid new order insert.' }, { status: 200 });
    }

    const newOrder = payload.record;

    // Check if the new order status is 'pending'
    if (newOrder.status === 'pending') {
      console.log(`API Route: New pending order detected: ${newOrder.id}`);

      const channelName = 'pending-order-notifications';
      const channel = supabaseAdmin.channel(channelName);

      // Broadcast a simple message indicating a new pending order
      const broadcastPayload = {
        event: 'new_pending_order', // Custom event name
        data: {
          orderId: newOrder.id,
          createdAt: newOrder.created_at,
        },
      };

      console.log(`API Route: Broadcasting on channel '${channelName}':`, broadcastPayload);
      const status = await channel.send({
        type: 'broadcast',
        event: 'message', // Standard event type for broadcast messages
        payload: broadcastPayload,
      });

      console.log(`API Route: Broadcast status for order ${newOrder.id}:`, status);

      // Important: Unsubscribe after sending to avoid resource leaks on the server instance
      // Note: In serverless environments, this might happen automatically, but good practice.
      await supabaseAdmin.removeChannel(channel);
      console.log(`API Route: Unsubscribed from channel ${channelName} for order ${newOrder.id}`);

      if (status !== 'ok') {
        console.error(`API Route: Failed to broadcast for order ${newOrder.id}. Status: ${status}`);
        // Potentially return an error status if broadcast failure is critical
        return NextResponse.json({ error: `Failed to broadcast notification for order ${newOrder.id}` }, { status: 500 });
      }

      return NextResponse.json({ message: `Broadcast successful for order ${newOrder.id}` }, { status: 200 });

    } else {
      console.log(`API Route: Order ${newOrder.id} status is '${newOrder.status}', not 'pending'. No broadcast needed.`);
      return NextResponse.json({ message: 'Order not pending, no broadcast needed.' }, { status: 200 });
    }
  } catch (error) {
    console.error('Error processing Supabase webhook:', error);
    return NextResponse.json({ error: 'Failed to process webhook payload.' }, { status: 500 });
  }
}
