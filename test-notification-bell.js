// Script to test the notification bell by creating a pending order
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getOrderCount() {
  try {
    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    if (error) {
      throw error;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Error getting order count:', error);
    return 0;
  }
}

async function createTestOrder() {
  try {
    // Get the first user from the profiles table to use as customer and profile
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (profilesError) {
      throw profilesError;
    }

    if (!profiles || profiles.length === 0) {
      throw new Error('No profiles found in the database');
    }

    const userId = profiles[0].id;
    
    // Get current pending order count
    const beforeCount = await getOrderCount();
    console.log(`Current pending order count: ${beforeCount}`);

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
      throw error;
    }

    console.log('Test order created successfully:', data);
    
    // Get new pending order count
    const afterCount = await getOrderCount();
    console.log(`New pending order count: ${afterCount}`);
    console.log(`Difference: ${afterCount - beforeCount}`);
    
    return data;
  } catch (error) {
    console.error('Error creating test order:', error);
    throw error;
  }
}

// Run the test
createTestOrder()
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
