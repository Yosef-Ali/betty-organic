// Remote Supabase Fix Script
// This script applies the notification system fixes to a remote Supabase instance

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for input
const prompt = (question) => new Promise((resolve) => {
  rl.question(question, (answer) => resolve(answer));
});

async function main() {
  console.log('=== Remote Supabase Notification System Fix ===');
  
  // Get Supabase credentials if not in environment variables
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    supabaseUrl = await prompt('Enter your Supabase URL (https://xxxx.supabase.co): ');
  }
  
  if (!supabaseKey) {
    supabaseKey = await prompt('Enter your Supabase service role key: ');
    console.log('Note: For security, consider adding SUPABASE_SERVICE_ROLE_KEY to your .env file instead');
  }
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase URL and service role key are required');
    process.exit(1);
  }
  
  try {
    // Initialize Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Connected to Supabase at', supabaseUrl);
    
    // Confirm before proceeding
    const confirm = await prompt('This will apply fixes to your REMOTE Supabase instance. Continue? (y/n): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log('Operation cancelled');
      process.exit(0);
    }
    
    console.log('\n1. Applying database fixes...');
    
    // Drop existing function and trigger
    console.log('- Dropping existing function and trigger...');
    await supabase.rpc('drop_function_if_exists', { 
      function_name: 'notify_order_status',
      cascade: true 
    }).catch(err => {
      // If the RPC doesn't exist, use raw SQL
      return supabase.rpc('run_sql', { 
        sql: 'DROP FUNCTION IF EXISTS notify_order_status() CASCADE;' 
      });
    });
    
    // Create the notification function
    console.log('- Creating notification function...');
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
    console.log('- Creating trigger...');
    const createTriggerSQL = `
      DROP TRIGGER IF EXISTS order_status_trigger ON public.orders;
      CREATE TRIGGER order_status_trigger
      AFTER INSERT OR UPDATE OR DELETE ON public.orders
      FOR EACH ROW EXECUTE FUNCTION notify_order_status();
    `;
    
    await supabase.rpc('run_sql', { sql: createTriggerSQL });
    
    // Enable realtime
    console.log('- Enabling realtime...');
    const enableRealtimeSQL = `
      DROP PUBLICATION IF EXISTS supabase_realtime;
      CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
      ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    `;
    
    await supabase.rpc('run_sql', { sql: enableRealtimeSQL });
    
    console.log('\n2. Verifying setup...');
    
    // Verify the trigger exists
    console.log('- Checking triggers...');
    const { data: triggers, error: triggerError } = await supabase.rpc('run_sql', { 
      sql: "SELECT * FROM pg_trigger WHERE tgname = 'order_status_trigger';" 
    });
    
    if (triggerError) {
      console.error('Error checking triggers:', triggerError);
    } else {
      console.log(`  Found ${triggers.length} matching triggers`);
    }
    
    // Verify realtime is enabled
    console.log('- Checking realtime publication...');
    const { data: publications, error: pubError } = await supabase.rpc('run_sql', { 
      sql: "SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';" 
    });
    
    if (pubError) {
      console.error('Error checking publications:', pubError);
    } else {
      console.log(`  Found ${publications.length} matching publications`);
    }
    
    // Ask if user wants to create a test order
    const createTest = await prompt('\nDo you want to create a test pending order? (y/n): ');
    
    if (createTest.toLowerCase() === 'y') {
      console.log('\n3. Creating test pending order...');
      
      // Get an admin user
      console.log('- Finding admin user...');
      const { data: adminUsers, error: adminError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);
      
      if (adminError) {
        console.error('Error finding admin user:', adminError);
      } else if (!adminUsers || adminUsers.length === 0) {
        console.log('  No admin users found. Skipping test order creation.');
      } else {
        const adminId = adminUsers[0].id;
        console.log(`  Found admin user: ${adminId}`);
        
        // Create a test order
        console.log('- Creating test order...');
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            profile_id: adminId,
            customer_profile_id: adminId,
            total_amount: 99.99,
            status: 'pending',
            type: 'test',
            display_id: `TEST-${Math.floor(Math.random() * 1000000)}`,
          })
          .select()
          .single();
        
        if (orderError) {
          console.error('Error creating test order:', orderError);
        } else {
          console.log(`  Test order created successfully: ${order.id}`);
        }
      }
    }
    
    console.log('\n✅ Fix completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Restart your Next.js application');
    console.log('2. Visit /debug/notifications to test the notification system');
    console.log('3. Create a test order and check if the notification bell updates');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    rl.close();
  }
}

main();
