// Script to fix RLS policies using individual SQL commands
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Create admin client with service role
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSql(sql, description) {
  try {
    console.log(`🔧 ${description}...`);
    const { data, error } = await supabase.rpc('sql', { query: sql });
    
    if (error) {
      console.error(`❌ ${description} failed:`, error);
      return false;
    }
    
    console.log(`✅ ${description} completed`);
    return true;
  } catch (err) {
    console.error(`❌ ${description} error:`, err);
    return false;
  }
}

const fixPolicies = async () => {
  console.log('🚀 Starting policy fixes...');

  // Drop existing INSERT policies
  await executeSql(
    `DROP POLICY IF EXISTS "Enable insert for all users" ON public.orders;`,
    'Dropping old INSERT policy 1'
  );
  
  await executeSql(
    `DROP POLICY IF EXISTS "Comprehensive orders insert policy" ON public.orders;`,
    'Dropping old INSERT policy 2'
  );

  // Create new INSERT policy
  await executeSql(
    `CREATE POLICY "Allow authenticated users to create orders"
     ON public.orders
     FOR INSERT
     WITH CHECK (
       auth.uid() IS NOT NULL
       OR
       customer_profile_id::text LIKE 'guest%'
     );`,
    'Creating new INSERT policy'
  );

  // Drop existing SELECT policies
  await executeSql(
    `DROP POLICY IF EXISTS "Enable select for users based on customer_profile_id" ON public.orders;`,
    'Dropping old SELECT policy 1'
  );
  
  await executeSql(
    `DROP POLICY IF EXISTS "Admin can view all orders" ON public.orders;`,
    'Dropping old SELECT policy 2'
  );
  
  await executeSql(
    `DROP POLICY IF EXISTS "Sales can view all orders" ON public.orders;`,
    'Dropping old SELECT policy 3'
  );
  
  await executeSql(
    `DROP POLICY IF EXISTS "Comprehensive orders access policy" ON public.orders;`,
    'Dropping old SELECT policy 4'
  );

  // Create new SELECT policy
  await executeSql(
    `CREATE POLICY "Orders access policy"
     ON public.orders
     FOR SELECT
     USING (
       customer_profile_id = auth.uid() 
       OR 
       customer_profile_id::text LIKE 'guest%'
       OR
       EXISTS (
         SELECT 1 FROM public.profiles 
         WHERE id = auth.uid() AND role = 'admin'
       )
       OR
       EXISTS (
         SELECT 1 FROM public.profiles 
         WHERE id = auth.uid() AND role = 'sales'
       )
     );`,
    'Creating new SELECT policy'
  );

  console.log('🎉 Policy fixes completed!');
};

// Run the fix
fixPolicies().then(() => {
  console.log('✅ All done!');
  process.exit(0);
}).catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});