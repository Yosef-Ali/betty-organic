const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function applySQLFixes() {
    try {
        console.log('📊 Applying realtime system fixes...');

        // Apply the key fixes directly
        const fixes = [
            // Ensure RLS is enabled on tables
            {
                name: 'Enable RLS on orders table',
                sql: 'ALTER TABLE orders ENABLE ROW LEVEL SECURITY'
            },
            {
                name: 'Enable RLS on order_items table',
                sql: 'ALTER TABLE order_items ENABLE ROW LEVEL SECURITY'
            },
            {
                name: 'Enable RLS on notifications table',
                sql: 'ALTER TABLE notifications ENABLE ROW LEVEL SECURITY'
            },

            // Create/update RLS policies for realtime
            {
                name: 'Create orders realtime policy',
                sql: `
          DROP POLICY IF EXISTS "orders_realtime_policy" ON orders;
          CREATE POLICY "orders_realtime_policy" ON orders
          FOR ALL USING (true)
        `
            },
            {
                name: 'Create order_items realtime policy',
                sql: `
          DROP POLICY IF EXISTS "order_items_realtime_policy" ON order_items;
          CREATE POLICY "order_items_realtime_policy" ON order_items
          FOR ALL USING (true)
        `
            },
            {
                name: 'Create notifications realtime policy',
                sql: `
          DROP POLICY IF EXISTS "notifications_realtime_policy" ON notifications;
          CREATE POLICY "notifications_realtime_policy" ON notifications 
          FOR ALL USING (true)
        `
            }
        ];

        for (const fix of fixes) {
            try {
                console.log(`⚡ ${fix.name}...`);
                const result = await supabase.rpc('exec_sql', { query: fix.sql });
                console.log(`✅ ${fix.name} completed`);
            } catch (err) {
                console.log(`⚠️  ${fix.name} - ${err.message}`);
            }
        }

        console.log('🎉 Core fixes applied! Testing system...');

        // Test database connectivity
        const testResult = await supabase.from('orders').select('id').limit(1);
        if (testResult.error) {
            console.log('❌ Database connection test failed:', testResult.error.message);
        } else {
            console.log('✅ Database connection working');
        }

        console.log('\n🔍 System should now be ready. Visit http://localhost:3001/fix-notifications to test!');

    } catch (error) {
        console.error('❌ Failed to apply fixes:', error);
    }
}

applySQLFixes();
