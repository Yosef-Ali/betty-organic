'use server';

import { createClient } from '@/lib/supabase/server';

export async function testRealtimeTrigger() {
  try {
    const supabase = await createClient();
    
    // Create a test order that should trigger real-time events
    const testOrder = {
      status: 'pending',
      total_amount: 99.99,
      type: 'realtime-test',
      display_id: `RT-${Date.now()}`,
      profile_id: '8909a357-b456-4532-8f60-6f6505be398f', // Your user ID
      customer_profile_id: '8909a357-b456-4532-8f60-6f6505be398f'
    };

    console.log('Creating test order for real-time:', testOrder);

    const { data: newOrder, error: createError } = await supabase
      .from('orders')
      .insert(testOrder)
      .select()
      .single();

    if (createError) {
      console.error('Create order error:', createError);
      return {
        success: false,
        error: `Order creation failed: ${createError.message}`,
        details: { createError, testOrder }
      };
    }

    console.log('Test order created successfully:', newOrder);

    // Also try updating the order to trigger UPDATE event
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ status: 'processing' })
      .eq('id', newOrder.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update order error:', updateError);
    } else {
      console.log('Test order updated successfully:', updatedOrder);
    }

    return {
      success: true,
      message: 'Real-time test order created and updated successfully',
      data: {
        created: newOrder,
        updated: updatedOrder
      }
    };

  } catch (error) {
    console.error('Realtime trigger test error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: { error }
    };
  }
}