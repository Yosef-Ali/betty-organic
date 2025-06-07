// Test script to simulate marketing page order creation
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🧪 Testing marketing page order creation with real-time monitoring...\n');

async function testMarketingPageOrder() {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Set up real-time listener first
    console.log('📡 Setting up real-time listener...');
    const channel = supabase
        .channel('marketing-test-channel')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'orders'
        }, (payload) => {
            console.log('✅ Real-time event received for marketing order:');
            console.log(JSON.stringify(payload, null, 2));
        })
        .subscribe((status) => {
            console.log(`📡 Subscription status: ${status}`);
        });

    // Wait a moment for subscription to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
        // Simulate creating an order like the marketing page does
        console.log('🛒 Creating marketing-style order...');

        // First ensure we have a profile
        const userId = '175a62a5-2b0d-4805-a450-4296b1b00c75';
        const userEmail = 'test@bettyorganic.com';

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .single();

        if (profileError && profileError.code !== 'PGRST116') {
            console.error('❌ Profile check error:', profileError);
            return;
        }

        if (!profile) {
            console.log('👤 Creating user profile...');
            const { error: createProfileError } = await supabase
                .from('profiles')
                .insert({
                    id: userId,
                    email: userEmail,
                    role: 'customer',
                    status: 'active',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                });

            if (createProfileError) {
                console.error('❌ Failed to create profile:', createProfileError);
                return;
            }
        }

        // Create order exactly like marketing page does
        const orderData = {
            profile_id: userId,
            customer_profile_id: userId,
            status: 'pending',
            type: 'online', // This is different from our test orders which use 'delivery'
            total_amount: 29.99,
            display_id: 'BTO-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        console.log('📦 Creating order with data:', JSON.stringify(orderData, null, 2));

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert(orderData)
            .select()
            .single();

        if (orderError) {
            console.error('❌ Failed to create order:', orderError);
            return;
        }

        console.log('✅ Marketing order created successfully:', order.id);

        // Create some order items too
        const orderItems = [
            {
                order_id: order.id,
                product_id: 'prod_001',
                quantity: 2,
                price: 15.99,
                product_name: 'Organic Apples'
            },
            {
                order_id: order.id,
                product_id: 'prod_002',
                quantity: 1,
                price: 13.99,
                product_name: 'Fresh Bananas'
            }
        ];

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error('❌ Failed to create order items:', itemsError);
        } else {
            console.log('✅ Order items created successfully');
        }

        // Wait for real-time events
        console.log('⏳ Waiting for real-time events...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Cleanup
        console.log('🧹 Cleaning up test order...');
        await supabase.from('order_items').delete().eq('order_id', order.id);
        await supabase.from('orders').delete().eq('id', order.id);

        console.log('✅ Test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        // Cleanup subscription
        channel.unsubscribe();
        console.log('🧹 Real-time subscription cleaned up');
    }
}

testMarketingPageOrder().then(() => {
    console.log('\n🎉 Marketing page order test completed!');
    console.log('📋 Next: Check the debug page at http://localhost:3000/fix-notifications');
    process.exit(0);
}).catch(error => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
});
