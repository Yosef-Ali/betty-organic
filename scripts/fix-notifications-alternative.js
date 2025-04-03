// Alternative script to fix notification issues
// This script uses the Supabase JavaScript client instead of the CLI

import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixNotificationSystem() {
  console.log('Fixing notification system...');

  try {
    // 1. Apply the fix for notification triggers
    console.log('Applying database fixes...');

    // Drop existing function and trigger
    await supabase.rpc('drop_function_if_exists', {
      function_name: 'notify_order_status',
      cascade: true
    });

    // Create the notification function
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION notify_order_status()
      RETURNS TRIGGER AS $$
      DECLARE
          payload json;
      BEGIN
          -- Notify only on INSERT or UPDATE if the status is 'pending'
          IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'pending' THEN
              payload := json_build_object(
                  'event', TG_OP,
                  'id', NEW.id,
                  'profile_id', NEW.profile_id,
                  'status', NEW.status,
                  'created_at', NEW.created_at,
                  'total_amount', NEW.total_amount
              );

              -- Send notification
              PERFORM pg_notify('order_status_channel', payload::text);

          -- Notify on DELETE only if the status was 'pending'
          ELSIF TG_OP = 'DELETE' AND OLD.status = 'pending' THEN
              payload := json_build_object(
                  'event', 'DELETE',
                  'id', OLD.id
              );

              -- Send notification
              PERFORM pg_notify('order_status_channel', payload::text);
          END IF;

          RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `;

    await supabase.rpc('run_sql', { sql: createFunctionSQL });

    // Create the trigger
    const createTriggerSQL = `
      DROP TRIGGER IF EXISTS order_status_trigger ON public.orders;
      CREATE TRIGGER order_status_trigger
      AFTER INSERT OR UPDATE OR DELETE ON public.orders
      FOR EACH ROW EXECUTE FUNCTION notify_order_status();
    `;

    await supabase.rpc('run_sql', { sql: createTriggerSQL });

    // Enable realtime
    const enableRealtimeSQL = `
      DROP PUBLICATION IF EXISTS supabase_realtime;
      CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
      ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    `;

    await supabase.rpc('run_sql', { sql: enableRealtimeSQL });

    // 2. Create a test pending order
    console.log('Creating a test pending order...');

    // Get an admin user securely
    // First get all users with admin role
    const { data: adminUsers } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    // Verify each user's authentication status
    let verifiedAdminId = null;
    if (adminUsers && adminUsers.length > 0) {
      // Get the admin ID
      verifiedAdminId = adminUsers[0].id;

      // Verify this is a valid user in the auth system
      const { data: authData, error: authError } = await supabase.auth.admin.getUserById(verifiedAdminId);

      if (authError || !authData?.user) {
        console.warn('Could not verify admin user authentication:', authError?.message || 'User not found');
        verifiedAdminId = null;
      }
    }

    if (verifiedAdminId) {
      // Create a test order with the verified admin ID
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          profile_id: verifiedAdminId,
          customer_profile_id: verifiedAdminId,
          total_amount: 99.99,
          status: 'pending',
          type: 'test',
          display_id: `TEST-${Math.floor(Math.random() * 1000000)}`,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating test order:', error);
      } else {
        console.log('Test order created successfully:', order.id);
      }
    } else {
      console.log('No verified admin users found. Skipping test order creation.');
      console.log('Please create a test order manually through the debug page.');
    }

    console.log('Fix completed. Please follow these steps:');
    console.log('1. Restart your Next.js application');
    console.log('2. Visit /debug/notifications to test the notification system');
    console.log('3. Create a test order and check if the notification bell updates');

  } catch (error) {
    console.error('Error fixing notification system:', error);
  }
}

// Run the fix
fixNotificationSystem();
