// Quick script to check customer phone data in the database
// Run this with: node check-customer-phones.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// You'll need to add your Supabase credentials here
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCustomerPhones() {
    try {
        // Get all profiles with role customer
        const { data: customers, error } = await supabase
            .from('profiles')
            .select('id, name, email, phone, role')
            .eq('role', 'customer');

        if (error) {
            console.error('Error fetching customers:', error);
            return;
        }

        console.log('=== CUSTOMER PHONE ANALYSIS ===');
        console.log(`Total customers: ${customers?.length || 0}`);

        const customersWithPhone = customers?.filter(c => c.phone && c.phone.trim() !== '') || [];
        const customersWithoutPhone = customers?.filter(c => !c.phone || c.phone.trim() === '') || [];

        console.log(`Customers with phone: ${customersWithPhone.length}`);
        console.log(`Customers without phone: ${customersWithoutPhone.length}`);

        console.log('\n=== CUSTOMERS WITH PHONES ===');
        customersWithPhone.forEach(customer => {
            console.log(`${customer.name || customer.email}: ${customer.phone}`);
        });

        console.log('\n=== CUSTOMERS WITHOUT PHONES ===');
        customersWithoutPhone.slice(0, 10).forEach(customer => {
            console.log(`${customer.name || customer.email}: NO PHONE`);
        });

        if (customersWithoutPhone.length > 10) {
            console.log(`... and ${customersWithoutPhone.length - 10} more`);
        }

        // Also check recent orders to see which ones have customer phone data
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select(`
        id, 
        display_id, 
        created_at, 
        customer:profiles!orders_customer_profile_id_fkey (id, name, email, phone)
      `)
            .order('created_at', { ascending: false })
            .limit(10);

        if (ordersError) {
            console.error('Error fetching orders:', ordersError);
            return;
        }

        console.log('\n=== RECENT ORDERS PHONE DATA ===');
        orders?.forEach(order => {
            const customerPhone = order.customer?.phone || 'NO PHONE';
            const customerName = order.customer?.name || order.customer?.email || 'Unknown';
            console.log(`Order ${order.display_id || order.id}: ${customerName} - ${customerPhone}`);
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

checkCustomerPhones();
