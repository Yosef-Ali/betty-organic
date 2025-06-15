// Test script to verify customer phone data
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testCustomerData() {
    console.log('Testing customer data retrieval...');

    try {
        // Test the customer list query
        const { data: customers, error } = await supabase
            .from('profiles')
            .select('id, name, phone, email')
            .eq('role', 'customer')
            .limit(5);

        if (error) {
            console.error('Error fetching customers:', error);
            return;
        }

        console.log('Customer data retrieved:');
        customers.forEach((customer, index) => {
            console.log(`${index + 1}. ${customer.name} (${customer.id})`);
            console.log(`   Phone: ${customer.phone || 'No phone'}`);
            console.log(`   Email: ${customer.email || 'No email'}`);
            console.log('');
        });

        // Test the orders query to see if phone is included
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select(`
        id,
        total_amount,
        customer_profile:profiles!orders_customer_profile_id_fkey (
          id,
          name,
          phone,
          email
        )
      `)
            .limit(3);

        if (ordersError) {
            console.error('Error fetching orders:', ordersError);
            return;
        }

        console.log('Order data with customer phone:');
        orders.forEach((order, index) => {
            console.log(`${index + 1}. Order ${order.id} - Total: ${order.total_amount}`);
            if (order.customer_profile) {
                console.log(`   Customer: ${order.customer_profile.name}`);
                console.log(`   Phone: ${order.customer_profile.phone || 'No phone'}`);
                console.log(`   Email: ${order.customer_profile.email || 'No email'}`);
            }
            console.log('');
        });

    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

testCustomerData();
