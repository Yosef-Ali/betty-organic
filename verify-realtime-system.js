// verify-realtime-system.js
// This script tests the real-time system by creating both marketing and delivery orders
// and verifying that events are properly sent and received

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Constants
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DELAY_BETWEEN_TESTS = 5000;

// Create Supabase client with service role key for admin access
const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY,
    {
        auth: {
            persistSession: false,
        }
    }
);

async function getRandomProfile() {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, role')
        .limit(5);

    if (error) {
        throw new Error(`Failed to fetch profiles: ${error.message}`);
    }

    if (!data || data.length === 0) {
        throw new Error('No profiles found in the database');
    }

    // Return a random profile from the results
    return data[Math.floor(Math.random() * data.length)];
}

async function createDeliveryOrder(profileId) {
    const { data, error } = await supabase
        .from('orders')
        .insert({
            profile_id: profileId,
            customer_profile_id: profileId,
            status: 'pending',
            total_amount: 45.99,
            type: 'delivery',
            delivery_cost: 5.00,
            test_order: true,
            order_source: 'verification_script'
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to create delivery order: ${error.message}`);
    }

    return data;
}

async function createMarketingOrder(profileId) {
    const { data, error } = await supabase
        .from('orders')
        .insert({
            profile_id: profileId,
            customer_profile_id: profileId,
            status: 'pending',
            total_amount: 35.50,
            type: 'online',
            delivery_cost: 5.00,
            test_order: true,
            order_source: 'marketing_page'
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to create marketing order: ${error.message}`);
    }

    return data;
}

async function listenForRealtimeEvents(timeout = 30000) {
    return new Promise((resolve) => {
        console.log('Setting up realtime listener...');

        const channel = supabase
            .channel('orders-debug')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: 'test_order=eq.true'
            }, (payload) => {
                console.log('⚡ Realtime event received:', {
                    event: payload.eventType,
                    order_id: payload.new?.id || payload.old?.id,
                    type: payload.new?.type || payload.old?.type,
                    status: payload.new?.status || payload.old?.status,
                });
            })
            .subscribe();

        // Return the channel after a short delay to let it connect
        setTimeout(() => {
            resolve(channel);
        }, 3000);

        // Safety timeout to ensure we don't listen forever
        setTimeout(() => {
            resolve(channel);
        }, timeout);
    });
}

async function cleanupTestOrders() {
    console.log('Cleaning up test orders...');
    const { error } = await supabase
        .from('orders')
        .delete()
        .eq('test_order', true);

    if (error) {
        console.error('Error cleaning up test orders:', error);
    } else {
        console.log('Test orders cleaned up successfully');
    }
}

async function run() {
    console.log('🔍 Starting real-time verification process');
    console.log(`🔌 Connected to: ${SUPABASE_URL}`);

    let profile;
    let realtimeChannel;

    try {
        // Set up realtime listener first
        realtimeChannel = await listenForRealtimeEvents();

        // Get a random profile for our test orders
        profile = await getRandomProfile();
        console.log(`🧑‍💼 Using profile ID: ${profile.id}, Role: ${profile.role}`);

        // Create a delivery order
        console.log('\n📦 Creating delivery order...');
        const deliveryOrder = await createDeliveryOrder(profile.id);
        console.log(`✅ Delivery order created: ${deliveryOrder.id}`);

        // Wait between tests
        console.log(`⏳ Waiting ${DELAY_BETWEEN_TESTS / 1000}s before next test...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_TESTS));

        // Create a marketing order
        console.log('\n🎯 Creating marketing order...');
        const marketingOrder = await createMarketingOrder(profile.id);
        console.log(`✅ Marketing order created: ${marketingOrder.id}`);

        // Wait to observe more events
        console.log('⏳ Waiting for more realtime events...');
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_TESTS));

    } catch (error) {
        console.error('❌ Error during verification:', error);
    } finally {
        // Clean up test channel
        if (realtimeChannel) {
            await supabase.removeChannel(realtimeChannel);
            console.log('🔌 Realtime channel closed');
        }

        // Clean up test orders
        await cleanupTestOrders();

        console.log('\n✨ Verification process completed');
    }
}

// Run the verification
run();
