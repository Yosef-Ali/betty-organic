'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import {
  getPendingOrders,
  createTestPendingOrder,
} from '@/app/actions/notificationActions';
import {
  getPendingOrdersForDebug,
  createTestPendingOrderForDebug,
  checkSupabaseEnvVars
} from '@/app/actions/testActions';
import {
  testAdminConnection
} from '@/app/actions/testSupabase';
import { useAuth } from '@/hooks/useAuth';

export function NotificationTester() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [envVars, setEnvVars] = useState<any>(null);
  const [adminTest, setAdminTest] = useState<any>(null);
  const { user } = useAuth();

  const createTestOrder = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      // Use the debug server action that doesn't require authentication
      const result = await createTestPendingOrderForDebug();

      if (!result.success) {
        throw new Error(result.error as string);
      }

      setResult({
        success: true,
        message: `Test order created successfully! ID: ${result.order?.id || 'unknown'
          }`,
      });

      // Fetch pending orders
      fetchPendingOrders();
    } catch (error: any) {
      setResult({
        success: false,
        message: `Error: ${error.message || 'Unknown error'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingOrders = async () => {
    try {
      // Use the debug server action that doesn't require authentication
      const result = await getPendingOrdersForDebug();

      if (!result.success && result.error) {
        setResult({
          success: false,
          message: `Error fetching orders: ${result.error}`,
        });
        setPendingOrders([]);
        return;
      }

      setPendingOrders(result.orders || []);
      console.log(`[DEBUG] Found ${result.count} pending orders`);
    } catch (error) {
      console.error('Error fetching pending orders:', {
        message: 'Invalid API key',
        hint: 'Double check your Supabase `anon` or `service_role` API key.'
      });
      setResult({
        success: false,
        message: `Error fetching orders: ${error instanceof Error ? error.message : 'Unknown error'
          }`,
      });
      setPendingOrders([]);
    }
  };

  const checkEnvironmentVars = async () => {
    const vars = await checkSupabaseEnvVars();
    setEnvVars(vars);

    if (!vars.hasUrl || !vars.hasServiceKey) {
      setResult({
        success: false,
        message: "Missing required Supabase environment variables. Check the diagnostic information below."
      });
    }
  };

  const testSupabaseAdmin = async () => {
    setIsLoading(true);
    try {
      const result = await testAdminConnection();
      setAdminTest(result);

      if (!result.success) {
        setResult({
          success: false,
          message: `Admin connection test failed: ${result.error}`
        });
      } else {
        setResult({
          success: true,
          message: "Admin connection test successful!"
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Error testing admin connection: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch pending orders on component mount and check env vars
  useEffect(() => {
    fetchPendingOrders();
    checkEnvironmentVars();

    // Set up a polling interval to periodically check for new orders
    const interval = setInterval(fetchPendingOrders, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [user]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Notification System Tester</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {result && (
          <Alert variant={result.success ? 'default' : 'destructive'}>
            <AlertTitle>{result.success ? 'Success' : 'Error'}</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}

        {envVars && (
          <div className="mb-4 p-3 border rounded bg-slate-50">
            <h3 className="text-sm font-medium mb-1">Environment Variables Status:</h3>
            <div className="text-xs space-y-1">
              <div>NEXT_PUBLIC_SUPABASE_URL: {envVars.hasUrl ? '✅' : '❌'} {envVars.urlPrefix}</div>
              <div>NEXT_PUBLIC_SUPABASE_ANON_KEY: {envVars.hasAnonKey ? '✅' : '❌'} {envVars.anonKeyPrefix}</div>
              <div>SUPABASE_SERVICE_ROLE_KEY: {envVars.hasServiceKey ? '✅' : '❌'} {envVars.serviceKeyPrefix}</div>
            </div>
            <Button
              onClick={testSupabaseAdmin}
              variant="outline"
              size="sm"
              className="mt-2"
              disabled={isLoading}
            >
              {isLoading ? 'Testing...' : 'Test Admin Connection'}
            </Button>
          </div>
        )}

        {adminTest && (
          <div className="mb-4 p-3 border rounded bg-slate-50">
            <h3 className="text-sm font-medium mb-1">Admin Connection Test:</h3>
            <div className="text-xs">
              <pre className="whitespace-pre-wrap overflow-auto max-h-32">
                {JSON.stringify(adminTest, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-medium mb-2">Pending Orders</h3>
          {pendingOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No pending orders found
            </p>
          ) : (
            <ul className="space-y-2">
              {pendingOrders.map(order => (
                <li key={order.id} className="text-sm border p-2 rounded">
                  <div>
                    <strong>ID:</strong> {order.id.slice(0, 8)}...
                  </div>
                  <div>
                    <strong>Created:</strong>{' '}
                    {new Date(order.created_at).toLocaleString()}
                  </div>
                  <div>
                    <strong>Amount:</strong> ETB {order.total_amount}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={fetchPendingOrders} variant="outline">
          Refresh Orders
        </Button>
        <Button onClick={createTestOrder} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Test Order'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
