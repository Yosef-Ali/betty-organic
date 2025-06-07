const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testAndFixRealtime() {
    console.log('🔧 Testing and fixing realtime system...');

    try {
        // Test 1: Basic database connection
        console.log('\n1️⃣ Testing database connection...');
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('id')
            .limit(1);

        if (ordersError) {
            console.log('❌ Database connection failed:', ordersError.message);
            return;
        } else {
            console.log('✅ Database connection successful');
        }

        // Test 2: Check if tables exist
        console.log('\n2️⃣ Checking required tables...');
        const tables = ['orders', 'order_items'];
        for (const table of tables) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);

                if (error) {
                    console.log(`❌ Table ${table} error:`, error.message);
                } else {
                    console.log(`✅ Table ${table} accessible`);
                }
            } catch (err) {
                console.log(`❌ Table ${table} check failed:`, err.message);
            }
        }

        // Test 3: Test realtime subscription
        console.log('\n3️⃣ Testing realtime subscription...');

        const channel = supabase
            .channel('test-channel')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders'
            }, (payload) => {
                console.log('📡 Realtime event received:', payload);
            })
            .subscribe((status) => {
                console.log('📡 Subscription status:', status);
            });

        // Wait a moment for subscription to establish
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 4: Create a test order to trigger realtime
        console.log('\n4️⃣ Creating test order to verify realtime...');

        const testOrder = {
            profile_id: '175a62a5-2b0d-4805-a450-4296b1b00c75', // Use existing profile
            status: 'pending',
            total_amount: 1.00,
            type: 'delivery'
        };

        const { data: newOrder, error: orderError } = await supabase
            .from('orders')
            .insert(testOrder)
            .select()
            .single();

        if (orderError) {
            console.log('❌ Test order creation failed:', orderError.message);
        } else {
            console.log('✅ Test order created:', newOrder.id);

            // Wait for realtime event
            console.log('⏳ Waiting for realtime event...');
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Clean up test order
            await supabase
                .from('orders')
                .delete()
                .eq('id', newOrder.id);
            console.log('🧹 Test order cleaned up');
        }

        // Clean up subscription
        await supabase.removeChannel(channel);
        console.log('🧹 Test subscription cleaned up');

        console.log('\n🎉 Realtime system test completed!');
        console.log('📋 Next steps:');
        console.log('   1. Visit http://localhost:3000/fix-notifications to test frontend');
        console.log('   2. Check if notifications appear in the dashboard');
        console.log('   3. Monitor browser console for realtime events');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testAndFixRealtime();
