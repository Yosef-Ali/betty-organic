// Test real-time events directly with Supabase client
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🧪 Testing real-time connection...');

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Set up real-time subscription
console.log('📡 Setting up real-time subscription...');

const channel = supabase
  .channel('test-orders-channel')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'orders'
    },
    (payload) => {
      console.log('🎯 REAL-TIME EVENT RECEIVED:', {
        eventType: payload.eventType,
        table: payload.table,
        new: payload.new,
        old: payload.old,
        timestamp: new Date().toISOString()
      });
    }
  )
  .subscribe((status, error) => {
    console.log('📶 Subscription status:', status);
    if (error) {
      console.error('❌ Subscription error:', error);
    }
    
    if (status === 'SUBSCRIBED') {
      console.log('✅ Successfully subscribed to real-time events');
      
      // Create a test order after 2 seconds
      setTimeout(async () => {
        console.log('📦 Creating test order...');
        
        const { data, error } = await supabase
          .from('orders')
          .insert({
            profile_id: '8909a357-b456-4532-8f60-6f6505be398f',
            customer_profile_id: '8909a357-b456-4532-8f60-6f6505be398f',
            status: 'pending',
            total_amount: 77.77,
            type: 'sale',
            display_id: 'JS-' + Math.floor(Math.random() * 10000)
          })
          .select()
          .single();
          
        if (error) {
          console.error('❌ Failed to create test order:', error);
        } else {
          console.log('✅ Test order created:', data);
        }
      }, 2000);
      
      // Clean up after 10 seconds
      setTimeout(() => {
        console.log('🧹 Cleaning up...');
        supabase.removeChannel(channel);
        process.exit(0);
      }, 10000);
    }
  });

console.log('⏳ Waiting for real-time events...');