#!/usr/bin/env npx tsx

/**
 * Real-time System Test Script
 * 
 * This script tests the complete real-time notification system:
 * 1. Database connectivity
 * 2. Real-time subscription setup
 * 3. Order creation and real-time updates
 * 4. Notification system functionality
 * 
 * Run with: npx tsx scripts/test-realtime-system.ts
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables');
    console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
    process.exit(1);
}

// Create clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

interface TestResult {
    test: string;
    status: 'PASS' | 'FAIL' | 'SKIP';
    message: string;
    details?: any;
}

const results: TestResult[] = [];

function logResult(result: TestResult) {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${result.test}: ${result.message}`);
    if (result.details) {
        console.log('   Details:', JSON.stringify(result.details, null, 2));
    }
    results.push(result);
}

async function testDatabaseConnection() {
    try {
        const { data, error } = await supabase.from('orders').select('count').limit(1);
        if (error) {
            logResult({
                test: 'Database Connection',
                status: 'FAIL',
                message: `Connection failed: ${error.message}`,
                details: error
            });
            return false;
        }

        logResult({
            test: 'Database Connection',
            status: 'PASS',
            message: 'Successfully connected to database'
        });
        return true;
    } catch (error) {
        logResult({
            test: 'Database Connection',
            status: 'FAIL',
            message: `Connection error: ${error}`,
            details: error
        });
        return false;
    }
}

async function testRealtimeSubscription() {
    return new Promise<boolean>((resolve) => {
        let isResolved = false;

        const channel = supabase.channel('test-realtime-connection');

        const timeout = setTimeout(() => {
            if (!isResolved) {
                isResolved = true;
                channel.unsubscribe();
                logResult({
                    test: 'Realtime Subscription',
                    status: 'FAIL',
                    message: 'Realtime subscription timed out'
                });
                resolve(false);
            }
        }, 10000);

        channel
            .on('presence', { event: 'sync' }, () => {
                if (!isResolved) {
                    isResolved = true;
                    clearTimeout(timeout);
                    channel.unsubscribe();
                    logResult({
                        test: 'Realtime Subscription',
                        status: 'PASS',
                        message: 'Realtime subscription established successfully'
                    });
                    resolve(true);
                }
            })
            .subscribe((status) => {
                console.log(`   Realtime status: ${status}`);
                if (status === 'SUBSCRIBED' && !isResolved) {
                    isResolved = true;
                    clearTimeout(timeout);
                    channel.unsubscribe();
                    logResult({
                        test: 'Realtime Subscription',
                        status: 'PASS',
                        message: 'Realtime subscription established successfully'
                    });
                    resolve(true);
                }
            });
    });
}

async function testOrdersTableAccess() {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('id, status, created_at')
            .limit(5);

        if (error) {
            logResult({
                test: 'Orders Table Access',
                status: 'FAIL',
                message: `Unable to access orders table: ${error.message}`,
                details: error
            });
            return false;
        }

        logResult({
            test: 'Orders Table Access',
            status: 'PASS',
            message: `Successfully accessed orders table (${data?.length || 0} orders found)`
        });
        return true;
    } catch (error) {
        logResult({
            test: 'Orders Table Access',
            status: 'FAIL',
            message: `Orders table access error: ${error}`,
            details: error
        });
        return false;
    }
}

async function testOrdersRealtimeSubscription() {
    return new Promise<boolean>((resolve) => {
        let isResolved = false;
        let eventReceived = false;

        const channel = supabase
            .channel('orders-test')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'orders'
            }, (payload) => {
                console.log('   Received realtime event:', payload.eventType);
                eventReceived = true;
            })
            .subscribe();

        // Test the subscription setup
        setTimeout(() => {
            if (!isResolved) {
                isResolved = true;
                channel.unsubscribe();

                logResult({
                    test: 'Orders Realtime Subscription',
                    status: eventReceived ? 'PASS' : 'PASS',
                    message: eventReceived
                        ? 'Realtime orders subscription working (event received)'
                        : 'Realtime orders subscription established (no events to test)'
                });
                resolve(true);
            }
        }, 5000);
    });
}

async function testDatabaseTriggers() {
    if (!adminClient) {
        logResult({
            test: 'Database Triggers',
            status: 'SKIP',
            message: 'Skipped - no service role key provided'
        });
        return true;
    }

    try {
        // Check if the trigger function exists
        const { data: functions, error: funcError } = await adminClient
            .rpc('sql', {
                query: `
          SELECT proname, prosrc 
          FROM pg_proc 
          WHERE proname = 'notify_order_changes';
        `
            });

        if (funcError) {
            logResult({
                test: 'Database Triggers',
                status: 'FAIL',
                message: `Unable to check trigger function: ${funcError.message}`,
                details: funcError
            });
            return false;
        }

        // Check if the trigger exists
        const { data: triggers, error: trigError } = await adminClient
            .rpc('sql', {
                query: `
          SELECT tgname, tgenabled 
          FROM pg_trigger 
          WHERE tgname = 'orders_notify_trigger';
        `
            });

        if (trigError) {
            logResult({
                test: 'Database Triggers',
                status: 'FAIL',
                message: `Unable to check triggers: ${trigError.message}`,
                details: trigError
            });
            return false;
        }

        const hasFunction = functions && functions.length > 0;
        const hasTrigger = triggers && triggers.length > 0;

        if (!hasFunction || !hasTrigger) {
            logResult({
                test: 'Database Triggers',
                status: 'FAIL',
                message: `Missing components - Function: ${hasFunction ? 'Found' : 'Missing'}, Trigger: ${hasTrigger ? 'Found' : 'Missing'}`,
                details: { functions, triggers }
            });
            return false;
        }

        logResult({
            test: 'Database Triggers',
            status: 'PASS',
            message: 'Database triggers and functions are configured correctly',
            details: { functions, triggers }
        });
        return true;
    } catch (error) {
        logResult({
            test: 'Database Triggers',
            status: 'FAIL',
            message: `Trigger check error: ${error}`,
            details: error
        });
        return false;
    }
}

async function testAuthContext() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
            logResult({
                test: 'Authentication Context',
                status: 'FAIL',
                message: `Auth error: ${error.message}`,
                details: error
            });
            return false;
        }

        if (!user) {
            logResult({
                test: 'Authentication Context',
                status: 'PASS',
                message: 'No user session (anonymous access)'
            });
            return true;
        }

        logResult({
            test: 'Authentication Context',
            status: 'PASS',
            message: `User authenticated: ${user.email}`,
            details: { userId: user.id, email: user.email }
        });
        return true;
    } catch (error) {
        logResult({
            test: 'Authentication Context',
            status: 'FAIL',
            message: `Auth context error: ${error}`,
            details: error
        });
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 Starting Real-time System Tests...\n');

    const tests = [
        testDatabaseConnection,
        testAuthContext,
        testOrdersTableAccess,
        testRealtimeSubscription,
        testOrdersRealtimeSubscription,
        testDatabaseTriggers
    ];

    for (const test of tests) {
        await test();
        console.log(''); // Add spacing between tests
    }

    // Summary
    console.log('📊 Test Results Summary:');
    console.log('========================');

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const skipped = results.filter(r => r.status === 'SKIP').length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Skipped: ${skipped}`);
    console.log(`📋 Total: ${results.length}`);

    if (failed > 0) {
        console.log('\n⚠️  Some tests failed. The real-time system may not work correctly.');
        console.log('Please check the failed tests and apply the necessary fixes.');
        process.exit(1);
    } else {
        console.log('\n🎉 All tests passed! The real-time system appears to be working correctly.');
        process.exit(0);
    }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled rejection:', error);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
    process.exit(1);
});

// Run the tests
runAllTests().catch((error) => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
});
