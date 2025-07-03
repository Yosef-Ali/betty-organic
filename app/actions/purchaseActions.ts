'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Order } from '@/types/order';
import { getUser } from './auth';
import { v4 as uuidv4 } from 'uuid';
import { orderIdService } from '@/app/services/orderIdService';
import { revalidatePath } from 'next/cache';

export async function handlePurchaseOrder(
  items: {
    id: string;
    name: string;
    pricePerKg: number;
    grams: number;
  }[],
  total: number,
) {
  try {
    // Input validation
    if (!items?.length) {
      return {
        error: 'No items provided for order',
        status: 400
      };
    }

    if (!total || total <= 0) {
      return {
        error: 'Invalid total amount',
        status: 400
      };
    }

    // Get current user if available, otherwise use guest flow
    let userId: string;
    let userRole = 'customer';
    let userEmail: string;
    try {
      const authData = await getUser();
      if (authData) {
        userId = authData.id;
        userRole = authData.profile?.role || 'customer';
        userEmail = authData.email || `${userId}@guest.bettyorganic.com`;
      } else {
        userId = uuidv4(); // Generate a unique ID for guest users
        userEmail = `guest-${userId}@guest.bettyorganic.com`;
      }
    } catch (error) {
      userId = uuidv4();
      userEmail = `guest-${userId}@guest.bettyorganic.com`;
    }

    // Generate a display ID for the order
    const display_id = await orderIdService.generateOrderID();

    // Get Supabase client
    const supabase = await createClient();

    // First, ensure the user exists in the profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking profile:', profileError);
      return {
        error: 'Failed to check user profile',
        status: 500
      };
    }

    // If profile doesn't exist, create it
    if (!profile) {
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: userEmail,
          role: userRole,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (createProfileError) {
        console.error('Failed to create profile:', createProfileError);
        return {
          error: 'Failed to create user profile',
          status: 500
        };
      }
    }

    // Now create the order with required fields
    const orderData = {
      profile_id: userId,
      customer_profile_id: userId,
      status: 'pending',
      type: 'online',
      total_amount: Number(total.toFixed(2)),
      display_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('Failed to create order:', orderError);
      return {
        error: `Failed to create order: ${orderError.message}`,
        status: 500
      };
    }

    if (!order) {
      console.error('No order data returned from insert');
      return {
        error: 'No order data returned',
        status: 500
      };
    }

    // Create order items using the admin client
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.id,
      quantity: Math.round(item.grams),
      price: Number(((item.pricePerKg * item.grams) / 1000).toFixed(2)),
      product_name: item.name
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Failed to create order items:', itemsError);
      // Cleanup the order if items failed
      await supabase.from('orders').delete().eq('id', order.id);
      return {
        error: `Failed to create order items: ${itemsError.message}`,
        status: 500
      };
    }

    // Log order details for manual admin processing
    try {
      console.log('� New order created - manual admin processing required:', order.display_id);

      // Get user profile for customer info
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('name, phone, email')
        .eq('id', userId)
        .single();

      const customerName = userProfile?.name || userEmail?.split('@')[0] || 'Customer';
      const customerPhone = userProfile?.phone || 'Not provided';

      console.log('📋 Order details for manual processing:', {
        orderId: order.display_id || `BO-${order.id}`,
        customerName,
        customerPhone,
        customerEmail: userEmail,
        items: items.map(item => ({
          name: item.name,
          grams: item.grams,
          price: Number(((item.pricePerKg * item.grams) / 1000).toFixed(2)),
          unit_price: item.pricePerKg
        })),
        total: Number(total.toFixed(2))
      });

      console.log('✅ Order logged for manual admin processing');
    } catch (logError) {
      console.error('❌ Failed to log order details:', logError);
      // Don't fail the order creation if logging fails
    }

    // Revalidate the dashboard paths to show the new order
    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard');

    return { data: order, status: 200 };
  } catch (err) {
    console.error('Purchase order error:', err);
    return {
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
      status: 500
    };
  }
}

export async function handleGuestOrder(
  items: {
    id: string;
    name: string;
    pricePerKg: number;
    grams: number;
  }[],
  total: number,
  customerInfo: {
    name: string;
    phone: string;
    address: string;
  }
) {
  try {
    // Input validation
    if (!items?.length) {
      return {
        error: 'No items provided for order',
        status: 400
      };
    }

    if (!total || total <= 0) {
      return {
        error: 'Invalid total amount',
        status: 400
      };
    }

    if (!customerInfo.phone || !customerInfo.address) {
      return {
        error: 'Phone number and delivery address are required',
        status: 400
      };
    }

    // For guest orders, we'll use the same approach as handlePurchaseOrder
    // but store guest info in localStorage/session for reference
    let guestUserId: string;
    try {
      guestUserId = uuidv4();
      if (!guestUserId || guestUserId === '' || typeof guestUserId !== 'string') {
        throw new Error('UUID generation returned invalid value');
      }
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(guestUserId)) {
        throw new Error('Generated UUID is not in valid format');
      }
    } catch (err) {
      console.error('❌ UUID generation error:', err);
      // Use crypto.randomUUID as fallback if available, otherwise use timestamp-based UUID
      try {
        guestUserId = crypto.randomUUID();
      } catch (cryptoErr) {
        // Final fallback - use existing user ID from database
        console.error('❌ crypto.randomUUID also failed, using database fallback');
        const supabase = await createClient();
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .limit(1)
          .single();

        if (existingUser?.id) {
          guestUserId = existingUser.id;
          console.log('🔄 Using existing user ID as fallback:', guestUserId);
        } else {
          throw new Error('No fallback UUID generation method available');
        }
      }
    }

    const guestEmail = `guest-${Date.now()}@guest.bettyorganic.com`;

    console.log('🆔 Generated guest user ID:', guestUserId);
    console.log('📧 Generated guest email:', guestEmail);
    console.log('🔍 UUID type:', typeof guestUserId);
    console.log('🔍 UUID length:', guestUserId?.length);
    console.log('🔍 UUID value as string:', JSON.stringify(guestUserId));

    // Final validation before proceeding
    if (!guestUserId || guestUserId === '' || typeof guestUserId !== 'string') {
      console.error('❌ Failed to generate valid guest user ID:', {
        value: guestUserId,
        type: typeof guestUserId,
        length: guestUserId?.length
      });
      return {
        error: 'Failed to generate guest user ID',
        status: 500
      };
    }

    // Generate a display ID for the order
    const display_id = await orderIdService.generateOrderID();

    // Get Supabase admin client for guest orders
    const supabase = await createAdminClient();

    // Try new schema first, fall back to old schema if needed
    // This handles schema cache issues after migration

    // For guest orders, use an existing admin user ID instead of creating new profiles
    // This avoids foreign key constraint issues with auth.users
    let actualProfileId: string;

    try {
      // Get an existing admin or system user ID to use for guest orders
      const { data: systemUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .single();

      if (systemUser?.id) {
        actualProfileId = systemUser.id;
        console.log('🔄 Using admin user ID for guest order:', actualProfileId);
      } else {
        // Fallback: use any existing user
        const { data: anyUser } = await supabase
          .from('profiles')
          .select('id')
          .limit(1)
          .single();

        if (anyUser?.id) {
          actualProfileId = anyUser.id;
          console.log('🔄 Using fallback user ID for guest order:', actualProfileId);
        } else {
          throw new Error('No existing users found in profiles table');
        }
      }
    } catch (err) {
      console.error('❌ Failed to find existing user for guest order:', err);
      return {
        error: 'Failed to set up guest order - no existing users available',
        status: 500
      };
    }

    // Try to create order with multiple fallback strategies
    let order = null;
    let finalError = null;

    // Strategy 1: Try with new schema (profile_id, customer_profile_id)
    try {
      console.log('Strategy 1: Trying new schema...');
      const newSchemaData = {
        profile_id: actualProfileId,
        customer_profile_id: actualProfileId,
        status: 'pending',
        type: 'online',
        total_amount: Number(total.toFixed(2)),
        display_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Guest order fields
        is_guest_order: true,
        guest_name: customerInfo.name || 'Guest Customer',
        guest_email: guestEmail,
        guest_phone: customerInfo.phone,
        guest_address: customerInfo.address
      };

      console.log('📋 New schema data:', JSON.stringify(newSchemaData, null, 2));
      console.log('🔍 Data type checks:');
      console.log('  - profile_id:', typeof newSchemaData.profile_id, newSchemaData.profile_id);
      console.log('  - type:', typeof newSchemaData.type, newSchemaData.type);
      console.log('  - status:', typeof newSchemaData.status, newSchemaData.status);
      console.log('  - total_amount:', typeof newSchemaData.total_amount, newSchemaData.total_amount);

      const { data: newOrder, error: newError } = await supabase
        .from('orders')
        .insert(newSchemaData)
        .select()
        .single();

      if (!newError && newOrder) {
        order = newOrder;
        console.log('✅ New schema worked');
      } else {
        throw newError;
      }
    } catch (error1) {
      console.log('❌ New schema failed:', error1);
      finalError = error1;

      // Strategy 2: Try with old schema (customer_id)
      try {
        console.log('Strategy 2: Trying old schema...');
        const oldSchemaData = {
          customer_id: actualProfileId,
          status: 'pending',
          type: 'online',
          total_amount: Number(total.toFixed(2)),
          display_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: oldOrder, error: oldError } = await supabase
          .from('orders')
          .insert(oldSchemaData)
          .select()
          .single();

        if (!oldError && oldOrder) {
          order = oldOrder;
          console.log('✅ Old schema worked');
        } else {
          throw oldError;
        }
      } catch (error2) {
        console.log('❌ Old schema failed:', error2);

        // Strategy 3: Try with minimal data
        try {
          console.log('Strategy 3: Trying minimal schema...');
          const minimalData = {
            status: 'pending',
            total_amount: Number(total.toFixed(2)),
            display_id
          };

          const { data: minimalOrder, error: minimalError } = await supabase
            .from('orders')
            .insert(minimalData)
            .select()
            .single();

          if (!minimalError && minimalOrder) {
            order = minimalOrder;
            console.log('✅ Minimal schema worked');
          } else {
            throw minimalError;
          }
        } catch (error3) {
          console.log('❌ All strategies failed');
          finalError = error3;
        }
      }
    }

    if (!order) {
      console.error('Failed to create order with any strategy:', finalError);
      return {
        error: `Failed to create order: ${finalError?.message || 'Unknown error'}`,
        status: 500
      };
    }

    console.log('✅ Order created successfully:', order.id);

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.id,
      quantity: Math.round(item.grams),
      price: Number(((item.pricePerKg * item.grams) / 1000).toFixed(2)),
      product_name: item.name
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Failed to create guest order items:', itemsError);
      // Cleanup the order if it was created
      await supabase.from('orders').delete().eq('id', order.id);
      return {
        error: `Failed to create order items: ${itemsError.message}`,
        status: 500
      };
    }

    // Log guest order details for manual admin processing
    try {
      console.log('� New guest order created - manual admin processing required:', order.display_id);

      console.log('📋 Guest order details for manual processing:', {
        orderId: order.display_id || `BO-GUEST-${order.id}`,
        customerName: customerInfo.name || 'Guest Customer',
        customerPhone: customerInfo.phone,
        deliveryAddress: customerInfo.address,
        items: items.map(item => ({
          name: item.name,
          grams: item.grams,
          price: Number(((item.pricePerKg * item.grams) / 1000).toFixed(2)),
          unit_price: item.pricePerKg
        })),
        total: Number(total.toFixed(2))
      });

      console.log('✅ Guest order logged for manual admin processing');
    } catch (logError) {
      console.error('❌ Failed to log guest order details:', logError);
      // Don't fail the order creation if logging fails
    }

    // Store guest info with the order data for reference
    const orderWithGuestInfo = {
      ...order,
      guest_info: {
        name: customerInfo.name || 'Guest Customer',
        phone: customerInfo.phone,
        address: customerInfo.address
      }
    };

    // Revalidate the dashboard paths to show the new order
    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard');

    return { data: orderWithGuestInfo, status: 200 };
  } catch (err) {
    console.error('Guest order error:', err);
    return {
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
      status: 500
    };
  }
}
