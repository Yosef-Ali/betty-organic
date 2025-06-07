#!/usr/bin/env npx tsx

/**
 * End-to-End Real-time Test Script
 * 
 * This script creates real orders and monitors for real-time notifications
 * to verify the complete system works.
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xmumlfgzvrliepxcjqil.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdW1sZmd6dnJsaWVweGNqcWlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc4ODY0MjgsImV4cCI6MjA0MzQ2MjQyOH0.QM-Y4MTmb-0BR-gxxTenQGyE0mnuJi1Why6OflYe6Ww';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdW1sZmd6dnJsaWVweGNqcWlsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNzg4NjQyOCwiZXhwIjoyMDQzNDYyNDI4fQ.8RDTrifR0MqXdJCZFzTEVTxfpyvU7fyEUySpExX--gQ';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase configuration');
    process.exit(1);
}

// Create clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = createClient(supabaseUrl, serviceRoleKey);

interface TestEvent {
    type: 'order' | 'notification';
    event: string;
    data: any;
    timestamp: number;
}

const events: TestEvent[] = [];
let ordersSubscription: any = null;
let notificationsSubscription: any = null;

function logEvent(type: TestEvent['type'], event: string, data: any) {
    const testEvent: TestEvent = {
        type,
        event,
        data,
        timestamp: Date.now()
    };
    events.push(testEvent);
    console.log(`🔔 [${type.toUpperCase()}] ${event}:`, JSON.stringify(data, null, 2));
}

async function setupRealtimeMonitoring() {
    console.log('👂 Setting up real-time event monitoring...\n');

    // Monitor orders table
    ordersSubscription = supabase
        .channel('test-orders')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'orders'
        }, (payload) => {
            logEvent('order', payload.eventType, {
                id: (payload.new as any)?.id || (payload.old as any)?.id,
                status: (payload.new as any)?.status || (payload.old as any)?.status,
                customer_name: (payload.new as any)?.customer_name || (payload.old as any)?.customer_name,
                total_amount: (payload.new as any)?.total_amount || (payload.old as any)?.total_amount
            });
        })
        .subscribe((status) => {
            console.log(`📡 Orders subscription status: ${status}`);
        });

    // Monitor notifications table
    notificationsSubscription = supabase
        .channel('test-notifications')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'notifications'
        }, (payload) => {
            logEvent('notification', payload.eventType, {
                id: (payload.new as any)?.id || (payload.old as any)?.id,
                type: (payload.new as any)?.type || (payload.old as any)?.type,
                title: (payload.new as any)?.title || (payload.old as any)?.title,
                order_id: (payload.new as any)?.order_id || (payload.old as any)?.order_id
            });
        })
        .subscribe((status) => {
            console.log(`🔔 Notifications subscription status: ${status}`);
        });

    // Wait for subscriptions to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Real-time monitoring active\n');
}

async function createTestOrder() {
    console.log('📦 Creating test order...\n');

    try {
        const testOrder = {
            customer_name: `Test Customer ${Date.now()}`,
            customer_phone: '+1234567890',
            customer_email: 'test@example.com',
            total_amount: Math.round((Math.random() * 100 + 10) * 100) / 100,
            status: 'pending',
            type: 'sale',
            products: [
                {
                    name: 'Test Organic Apple',
                    quantity: 2,
                    price: 1.99
                },
                {
                    name: 'Test Organic Banana',
                    quantity: 1,
                    price: 0.79
                }
            ],
            payment_method: 'cash',
            delivery_method: 'pickup'
        };

        const { data, error } = await adminClient
            .from('orders')
            .insert(testOrder)
            .select()
            .single();

        if (error) {
            console.error('❌ Failed to create test order:', error);
            return null;
        }

        console.log('✅ Test order created successfully:', {
            id: data.id,
            customer_name: data.customer_name,
            total_amount: data.total_amount,
            status: data.status
        });

        return data;
    } catch (err) {
        console.error('❌ Error creating test order:', err);
        return null;
    }
}

async function updateTestOrder(orderId: string) {
    console.log(`📝 Updating test order ${orderId}...\n`);

    try {
        const { data, error } = await adminClient
            .from('orders')
            .update({ status: 'confirmed' })
            .eq('id', orderId)
            .select()
            .single();

        if (error) {
            console.error('❌ Failed to update test order:', error);
            return null;
        }

        console.log('✅ Test order updated successfully:', {
            id: data.id,
            status: data.status
        });

        return data;
    } catch (err) {
        console.error('❌ Error updating test order:', err);
        return null;
    }
}

async function waitForEvents(expectedCount: number, timeoutMs: number = 10000) {
    console.log(`⏳ Waiting for ${expectedCount} events (timeout: ${timeoutMs}ms)...\n`);

    const startTime = Date.now();
    const startEventCount = events.length;

    while (Date.now() - startTime < timeoutMs) {
        if (events.length - startEventCount >= expectedCount) {
            console.log(`✅ Received ${events.length - startEventCount} events\n`);
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`⏰ Timeout reached. Received ${events.length - startEventCount} events out of ${expectedCount} expected\n`);
    return false;
}

function printEventSummary() {
    console.log('📊 Event Summary:');
    console.log('=================');

    const orderEvents = events.filter(e => e.type === 'order');
    const notificationEvents = events.filter(e => e.type === 'notification');

    console.log(`📦 Order events: ${orderEvents.length}`);
    orderEvents.forEach(e => {
        console.log(`   • ${e.event}: ${e.data.id} (${e.data.status})`);
    });

    console.log(`🔔 Notification events: ${notificationEvents.length}`);
    notificationEvents.forEach(e => {
        console.log(`   • ${e.event}: ${e.data.type} for order ${e.data.order_id}`);
    });

    console.log('');
}

async function runEndToEndTest() {
    console.log('🚀 Starting End-to-End Real-time Test\n');
    console.log('This test will:');
    console.log('1. Set up real-time monitoring');
    console.log('2. Create a test order');
    console.log('3. Update the order status');
    console.log('4. Monitor for real-time events');
    console.log('5. Report results\n');

    try {
        // Step 1: Setup monitoring
        await setupRealtimeMonitoring();

        // Step 2: Create test order
        const order = await createTestOrder();
        if (!order) {
            throw new Error('Failed to create test order');
        }

        // Wait for events
        console.log('⏳ Waiting for order creation events...');
        await waitForEvents(1, 5000); // Expect at least 1 event

        // Step 3: Update order status
        await updateTestOrder(order.id);

        // Wait for update events
        console.log('⏳ Waiting for order update events...');
        await waitForEvents(1, 5000); // Expect at least 1 more event

        // Step 4: Final wait to catch any delayed events
        console.log('⏳ Final wait for any additional events...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Step 5: Report results
        printEventSummary();

        const orderEvents = events.filter(e => e.type === 'order');
        const notificationEvents = events.filter(e => e.type === 'notification');

        console.log('🎯 Test Results:');
        console.log('================');

        if (orderEvents.length >= 2) {
            console.log('✅ Order real-time events: WORKING');
        } else {
            console.log('❌ Order real-time events: NOT WORKING');
        }

        if (notificationEvents.length > 0) {
            console.log('✅ Notification real-time events: WORKING');
        } else {
            console.log('❌ Notification real-time events: NOT WORKING');
        }

        const totalEvents = orderEvents.length + notificationEvents.length;
        console.log(`📊 Total events received: ${totalEvents}`);

        if (totalEvents >= 2) {
            console.log('🎉 Real-time system is WORKING correctly!');
            process.exit(0);
        } else {
            console.log('⚠️  Real-time system may have issues. Check the database configuration.');
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    } finally {
        // Cleanup
        if (ordersSubscription) {
            ordersSubscription.unsubscribe();
        }
        if (notificationsSubscription) {
            notificationsSubscription.unsubscribe();
        }
    }
}

// Handle cleanup on exit
process.on('SIGINT', () => {
    console.log('\n🛑 Test interrupted by user');
    if (ordersSubscription) ordersSubscription.unsubscribe();
    if (notificationsSubscription) notificationsSubscription.unsubscribe();
    process.exit(1);
});

// Run the test
runEndToEndTest().catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
});
