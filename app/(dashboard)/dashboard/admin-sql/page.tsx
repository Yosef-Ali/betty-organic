'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

export default function AdminSQLPage() {
  const [result, setResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const supabase = createClient();

  const fixPolicies = async () => {
    setIsExecuting(true);
    try {
      console.log('🔧 Fixing policies via raw SQL...');
      
      // Try to drop and recreate the INSERT policy directly
      const { data, error } = await supabase
        .from('orders')
        .select('id')
        .limit(1);

      if (error) {
        setResult({ error: 'Cannot access orders table: ' + error.message });
        return;
      }

      // Since we can't execute raw SQL via RPC, let's try a different approach
      // Let's test if we can insert with the current user
      const testOrder = {
        status: 'pending',
        total_amount: 1.00,
        type: 'policy-test',
        display_id: `TEST-${Date.now()}`,
        customer_profile_id: '8909a357-b456-4532-8f60-6f6505be398f' // Use your user ID
      };

      const { data: insertData, error: insertError } = await supabase
        .from('orders')
        .insert(testOrder)
        .select()
        .single();

      if (insertError) {
        setResult({ 
          error: 'Insert test failed', 
          details: insertError,
          suggestion: 'The RLS policies are blocking inserts. Need to fix via Supabase Dashboard.'
        });
      } else {
        setResult({ 
          success: true, 
          message: 'Insert test successful! Policies are working.',
          order: insertData
        });
      }

    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setIsExecuting(false);
    }
  };

  const manualPolicySQL = `
-- Copy and paste this into your Supabase SQL Editor:

-- Drop existing INSERT policies
DROP POLICY IF EXISTS "Enable insert for all users" ON public.orders;
DROP POLICY IF EXISTS "Comprehensive orders insert policy" ON public.orders;

-- Create new INSERT policy
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

-- Create new SELECT policy
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
  `;

  return (
    <div className="container max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Admin SQL - Policy Fix</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Current Policies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={fixPolicies} 
              disabled={isExecuting}
              className="w-full"
            >
              {isExecuting ? 'Testing...' : 'Test Order Insert'}
            </Button>
            
            <div className="text-xs text-muted-foreground">
              This will test if the current RLS policies allow order creation.
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded overflow-auto whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Manual Policy Fix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Since we can't execute raw SQL via the client, copy this SQL and run it in your Supabase Dashboard SQL Editor:
            </p>
            
            <Textarea
              value={manualPolicySQL}
              readOnly
              className="font-mono text-xs h-96"
            />
            
            <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded">
              <strong>Instructions:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Go to your Supabase Dashboard</li>
                <li>Navigate to SQL Editor</li>
                <li>Copy and paste the SQL above</li>
                <li>Click "Run" to execute</li>
                <li>Come back and test again</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}