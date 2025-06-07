'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/providers/ImprovedAuthProvider';

export default function DebugAuthPage() {
  const [authInfo, setAuthInfo] = useState<any>(null);
  const [policies, setPolicies] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const { user, profile } = useAuth();
  const supabase = createClient();

  const checkAuth = async () => {
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // Get user data
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      
      // Try to get profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      setAuthInfo({
        session: session ? 'Active' : 'None',
        sessionError,
        user: authUser,
        userError,
        profile: profileData,
        profileError,
        hookUser: user,
        hookProfile: profile
      });

    } catch (err) {
      setAuthInfo({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const testSimpleInsert = async () => {
    try {
      console.log('Testing with minimal data...');
      
      // Get current user ID from auth
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        setTestResult({ error: 'No authenticated user' });
        return;
      }

      // Try the most minimal insert possible
      const orderData = {
        status: 'pending',
        total_amount: 1.00,
        customer_profile_id: currentUser.id  // Use actual auth user ID
      };

      console.log('Inserting with data:', orderData);

      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (error) {
        setTestResult({ 
          error: 'Insert failed', 
          details: error,
          userData: { userId: currentUser.id, email: currentUser.email }
        });
      } else {
        setTestResult({ success: true, order: data });
      }

    } catch (err) {
      setTestResult({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const checkPolicies = async () => {
    try {
      // Try to query policy information
      const { data, error } = await supabase
        .from('information_schema.table_privileges')
        .select('*')
        .eq('table_name', 'orders');

      setPolicies({ data, error });
    } catch (err) {
      setPolicies({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  useEffect(() => {
    checkAuth();
  }, [user, profile]);

  const disablePolicySql = `
-- TEMPORARY: Disable RLS to test
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- Test insert, then re-enable with:
-- ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
  `;

  return (
    <div className="container max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Debug Authentication & Policies</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={checkAuth} className="w-full">
                Check Auth Status
              </Button>
              
              {authInfo && (
                <pre className="text-xs bg-muted p-4 rounded overflow-auto whitespace-pre-wrap max-h-96">
                  {JSON.stringify(authInfo, null, 2)}
                </pre>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Simple Insert Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={testSimpleInsert} className="w-full">
                Test Minimal Insert
              </Button>
              
              {testResult && (
                <pre className="text-xs bg-muted p-4 rounded overflow-auto whitespace-pre-wrap">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Temporary Fix - Disable RLS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-amber-600">
                If policies are too complex, temporarily disable RLS to test real-time:
              </p>
              
              <pre className="text-xs bg-amber-50 p-4 rounded border">
                {disablePolicySql}
              </pre>
              
              <div className="text-xs text-red-600">
                ⚠️ Only use this for testing! Re-enable RLS after testing.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}