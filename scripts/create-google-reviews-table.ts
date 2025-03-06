import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createGoogleReviewsTable() {
  try {
    // Read the migration SQL file
    const fs = require('fs');
    const path = require('path');
    const sqlContent = fs.readFileSync(
      path.join(process.cwd(), 'migrations', '20240305_create_google_reviews.sql'),
      'utf8'
    );

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', {
      sql: sqlContent,
    });

    if (error) throw error;

    console.log('✅ Successfully created google_reviews table and policies');
  } catch (error) {
    console.error('❌ Error creating google_reviews table:', error);
    process.exit(1);
  }
}

createGoogleReviewsTable();
