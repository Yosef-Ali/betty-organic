// compare-order-types.js
// This script creates both a "marketing" type order and a "delivery" type order 
// to compare how they're processed by the real-time system

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing if order type affects real-time events...\n');

async function compareOrderTypes() {
    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Missing Supabase credentials. Please check your .env.local file.');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let marketingOrder = null;
    let deliveryOrder = null;

    // Set up real-time listener first
    console.log('📡 Setting up real-time listener for orders table...');
    const channel = supabase
        .channel('order-type-test')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'orders'
        }, (payload) => {
            const { eventType, new: newOrder } = payload;
            console.log(`✅ Real-time event received: ${eventType} for order type: ${newOrder?.type || 'unknown'}`);
            console.log(`   Order ID: ${newOrder?.id}`);
            console.log(`   Order details:`, JSON.stringify({
                profile_id: newOrder?.profile_id,
                type: newOrder?.type,
                status: newOrder?.status,
                total_amount: newOrder?.total_amount
            }, null, 2));
        })
        .subscribe((status) => {
            console.log(`📡 Subscription status: ${status}`);
        });

    // Wait for subscription to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
        // Get a valid profile_id
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id')
            .limit(1);

        const profile_id = profiles?.[0]?.id || '175a62a5-2b0d-4805-a450-4296b1b00c75';
        console.log(`👤 Using profile ID: ${profile_id}`);

        // Create "marketing" type order (online)
        console.log('\n🛍️ Creating "online" order (marketing page type)...');
        const { data: mOrder, error: mError } = await supabase
            .from('orders')
            .insert({
                profile_id: profile_id,
                customer_profile_id: profile_id,
                status: 'pending',
                type: 'online',
                total_amount: 29.99,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (mError) {
            console.error('❌ Failed to create marketing order:', mError);
        } else {
            marketingOrder = mOrder;
            console.log(`✅ Marketing order created: ${mOrder.id}`);
        }

        // Wait briefly
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Create "delivery" type order (dashboard/test style)
        console.log('\n🚚 Creating "delivery" order (test type)...');
        const { data: dOrder, error: dError } = await supabase
            .from('orders')
            .insert({
                profile_id: profile_id,
                status: 'pending',
                type: 'delivery',
                total_amount: 19.99,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (dError) {
            console.error('❌ Failed to create delivery order:', dError);
        } else {
            deliveryOrder = dOrder;
            console.log(`✅ Delivery order created: ${dOrder.id}`);
        }

        // Wait for events
        console.log('\n⏳ Waiting for real-time events...');
        await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (error) {
        console.error('❌ Error during test:', error);
    } finally {
        // Clean up test orders
        console.log('\n🧹 Cleaning up test orders...');
        if (marketingOrder) {
            await supabase.from('orders').delete().eq('id', marketingOrder.id);
            console.log(`✓ Marketing order deleted: ${marketingOrder.id}`);
        }
        if (deliveryOrder) {
            await supabase.from('orders').delete().eq('id', deliveryOrder.id);
            console.log(`✓ Delivery order deleted: ${deliveryOrder.id}`);
        }

        // Close the channel
        await channel.unsubscribe();
        console.log('📡 Real-time subscription closed');
    }
}

compareOrderTypes().then(() => {
    console.log('\n🎯 Test completed!');
    process.exit(0);
}).catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
});
