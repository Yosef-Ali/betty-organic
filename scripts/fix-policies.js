// Script to fix RLS policies using service role key
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const fixPolicies = async () => {
  console.log('🔧 Fixing RLS policies...');

  const policiesSQL = `
-- Drop existing INSERT policies
DROP POLICY IF EXISTS "Enable insert for all users" ON public.orders;
DROP POLICY IF EXISTS "Comprehensive orders insert policy" ON public.orders;

-- Create a more permissive INSERT policy
CREATE POLICY "Allow authenticated users to create orders"
ON public.orders
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  OR
  customer_profile_id::text LIKE 'guest%'
);

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Enable select for users based on customer_profile_id" ON public.orders;
DROP POLICY IF EXISTS "Admin can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Sales can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Comprehensive orders access policy" ON public.orders;

-- Create comprehensive SELECT policy
CREATE POLICY "Orders access policy"
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
);

-- Drop existing UPDATE policies
DROP POLICY IF EXISTS "Admin can modify all orders" ON public.orders;
DROP POLICY IF EXISTS "Sales can modify orders" ON public.orders;
DROP POLICY IF EXISTS "Comprehensive orders update policy" ON public.orders;

-- Create comprehensive UPDATE policy
CREATE POLICY "Orders update policy"
ON public.orders
FOR UPDATE
USING (
  customer_profile_id = auth.uid()
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
);

-- Fix order_items INSERT policy
DROP POLICY IF EXISTS "Enable insert for order items" ON public.order_items;

CREATE POLICY "Allow order items insert"
ON public.order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = order_items.order_id
    AND (
      customer_profile_id = auth.uid()
      OR customer_profile_id::text LIKE 'guest%'
      OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'sales')
      )
    )
  )
);
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: policiesSQL });
    
    if (error) {
      console.error('❌ Failed to execute SQL:', error);
      return false;
    }
    
    console.log('✅ Policies fixed successfully!');
    return true;
  } catch (err) {
    console.error('❌ Error executing policies:', err);
    return false;
  }
};

// Run the fix
fixPolicies().then((success) => {
  if (success) {
    console.log('🎉 All policies have been updated!');
  } else {
    console.log('❌ Failed to update policies');
  }
  process.exit(success ? 0 : 1);
});