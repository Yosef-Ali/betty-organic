// Test script for the notification system
// Run this script to create a test pending order and verify the notification system

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to create a test pending order
async function createTestPendingOrder() {
  console.log('Creating test pending order...');
  
  try {
    // Get the first admin user to use as profile_id
    const { data: adminUsers, error: adminError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);
      
    if (adminError) {
      throw new Error(`Error fetching admin user: ${adminError.message}`);
    }
    
    if (!adminUsers || adminUsers.length === 0) {
      throw new Error('No admin users found');
    }
    
    const adminId = adminUsers[0].id;
    
    // Create a test order with pending status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        profile_id: adminId,
        customer_profile_id: adminId,
        total_amount: 100.00,
        status: 'pending',
        type: 'test',
        display_id: `TEST-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (orderError) {
      throw new Error(`Error creating test order: ${orderError.message}`);
    }
    
    console.log('Test order created successfully:', order);
    return order;
  } catch (error) {
    console.error('Error in createTestPendingOrder:', error);
    throw error;
  }
}

// Function to listen for notifications
async function listenForNotifications() {
  console.log('Setting up notification listener...');
  
  try {
    // Set up channel for postgres_changes
    const channel = supabase.channel('test-notifications')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: 'status=eq.pending'
        }, 
        (payload) => {
          console.log('Received postgres_changes notification:', payload);
        }
      )
      .on('broadcast', 
        { event: 'order_status_channel' }, 
        (payload) => {
          console.log('Received broadcast notification:', payload);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });
      
    return channel;
  } catch (error) {
    console.error('Error in listenForNotifications:', error);
    throw error;
  }
}

// Main function to run the test
async function runTest() {
  console.log('Starting notification system test...');
  
  try {
    // Set up notification listener
    const channel = await listenForNotifications();
    
    // Wait for subscription to be established
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create a test pending order
    const order = await createTestPendingOrder();
    
    // Wait for notifications to be processed
    console.log('Waiting for notifications...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Clean up
    await supabase.removeChannel(channel);
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
runTest();
