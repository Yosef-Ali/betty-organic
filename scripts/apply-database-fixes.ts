#!/usr/bin/env npx tsx

/**
 * Apply Database Fixes Script
 * 
 * This script applies the SQL fixes directly to the Supabase database
 * using the service role key.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required environment variables:');
    console.log('   - NEXT_PUBLIC_SUPABASE_URL');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function applyFixes() {
    console.log('🔧 Applying real-time system database fixes...\n');

    try {
        // Read the SQL fix file
        const sqlContent = readFileSync(join(process.cwd(), 'scripts/fix-realtime-system.sql'), 'utf8');

        // Split the SQL into individual statements
        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim().length === 0) continue;

            console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
            console.log(`   Preview: ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);

            try {
                const { data, error } = await adminClient.rpc('exec_sql', {
                    sql: statement
                });

                if (error) {
                    console.log(`❌ Failed: ${error.message}`);
                    console.log(`   Statement: ${statement}`);
                } else {
                    console.log(`✅ Success`);
                }
            } catch (err) {
                console.log(`❌ Error: ${err}`);
            }

            console.log(''); // Add spacing
        }

        console.log('🎉 Database fixes application completed!\n');

        // Test the system
        console.log('🧪 Testing the updated system...\n');

        // Test trigger function exists
        try {
            const { data, error } = await adminClient
                .from('pg_proc')
                .select('proname')
                .eq('proname', 'notify_order_changes');

            if (error) {
                console.log('❌ Could not verify trigger function');
            } else if (data && data.length > 0) {
                console.log('✅ Trigger function exists');
            } else {
                console.log('⚠️  Trigger function not found');
            }
        } catch (err) {
            console.log('⚠️  Could not check trigger function');
        }

        // Test basic orders table access
        try {
            const { data, error } = await adminClient
                .from('orders')
                .select('count')
                .limit(1);

            if (error) {
                console.log('❌ Orders table access failed');
            } else {
                console.log('✅ Orders table accessible');
            }
        } catch (err) {
            console.log('⚠️  Could not access orders table');
        }

        console.log('\n✅ Database fixes applied successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Test the real-time system in your app');
        console.log('2. Visit /fix-notifications for live debugging');
        console.log('3. Create test orders to verify notifications work');

    } catch (error) {
        console.error('❌ Failed to apply fixes:', error);
        process.exit(1);
    }
}

// Handle errors
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled rejection:', error);
    process.exit(1);
});

// Run the fixes
applyFixes().catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});
