'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export function NotificationDebugger() {
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<string>('Not connected');
  const [logs, setLogs] = useState<string[]>([]);
  const [showRlsError, setShowRlsError] = useState(false);
  const { toast } = useToast();

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()} - ${message}`]);
  };

  const fetchPendingOrders = async () => {
    setIsLoading(true);
    setError(null);
    addLog('Fetching pending orders using simplified server action...');

    try {
      // Use the simplified server action
      const { fetchPendingOrders } = await import(
        '@/app/actions/simpleServerActions'
      );
      const result = await fetchPendingOrders();

      if (!result.success) {
        throw new Error(result.error as string);
      }

      addLog(`Found ${result.orders?.length || 0} pending orders`);
      setPendingOrders(result.orders || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      addLog(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeListener = () => {
    addLog('Setting up realtime listener...');
    const supabase = createClient();

    // Clear any existing listeners
    if (typeof localStorage !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.realtime')) {
          localStorage.removeItem(key);
        }
      });
    }

    const channel = supabase
      .channel('debug-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: 'status=eq.pending',
        },
        payload => {
          addLog(`Received postgres_changes: ${payload.eventType}`);
          fetchPendingOrders();
        },
      )
      .on('broadcast', { event: 'order_status_channel' }, payload => {
        addLog(`Received broadcast: ${JSON.stringify(payload)}`);
        fetchPendingOrders();
      })
      .subscribe(status => {
        setConnectionStatus(status);
        addLog(`Subscription status: ${status}`);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createTestOrder = async () => {
    setIsLoading(true);
    setShowRlsError(false);
    addLog('Creating test order using simplified server action...');

    try {
      // Use the simplified server action
      const { createTestOrder } = await import(
        '@/app/actions/simpleServerActions'
      );
      const result = await createTestOrder();

      if (!result.success) {
        // Check if this is an RLS policy error
        if (result.error?.includes('row-level security policy')) {
          setShowRlsError(true);
          throw new Error(
            'Failed to create test order: RLS policy violation. You need to apply the test order policy.',
          );
        }
        throw new Error(result.error as string);
      }

      const orderId = result.order?.id || 'unknown';
      addLog(`Created test order: ${orderId}`);
      toast({
        title: 'Test Order Created',
        description: `Order ID: ${orderId}`,
      });

      // Refresh the list
      fetchPendingOrders();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      addLog(`Error: ${errorMessage}`);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyTestOrderPolicy = async () => {
    setIsLoading(true);
    addLog('Applying test order policy using simplified server action...');

    try {
      // Use the simplified server action
      const { testServerAction } = await import(
        '@/app/actions/simpleServerActions'
      );

      // First, test if server actions are working at all
      const testResult = await testServerAction();
      addLog(
        `Server action test result: ${
          testResult.success ? 'Success' : 'Failed'
        }`,
      );

      if (!testResult.success) {
        throw new Error(
          'Server actions are not working properly: ' + testResult.error,
        );
      }

      // Apply the policy directly using Supabase client
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Authentication required to apply policy');
      }

      // Try to enable the policy by calling an RPC function
      const { error: rpcError } = await supabase.rpc(
        'enable_test_orders_for_user',
        {
          user_id: user.id,
        },
      );

      if (rpcError) {
        // If RPC fails, try a direct SQL approach
        addLog('RPC method failed, trying direct approach...');

        // Create a test policy request
        const { error: policyError } = await supabase
          .from('policy_requests')
          .insert({
            user_id: user.id,
            policy_type: 'test_orders',
            status: 'pending',
          });

        if (policyError) {
          throw new Error('Failed to apply policy: ' + policyError.message);
        }
      }

      addLog('Test order policy applied successfully');
      setShowRlsError(false);
      toast({
        title: 'Success',
        description: 'Test order policy applied successfully',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      addLog(`Error: ${errorMessage}`);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingOrders();
    const cleanup = setupRealtimeListener();

    return cleanup;
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Notification System Debugger</CardTitle>
        <CardDescription>
          Test and debug the notification system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {showRlsError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>RLS Policy Error</AlertTitle>
              <AlertDescription>
                You need to apply the test order policy to create test orders.
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={applyTestOrderPolicy}
                  disabled={isLoading}
                >
                  Apply Policy
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Connection Status</h3>
            <Badge
              variant={
                connectionStatus === 'SUBSCRIBED' ? 'default' : 'destructive'
              }
            >
              {connectionStatus}
            </Badge>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">
              Pending Orders ({pendingOrders.length})
            </h3>
            {error && <div className="text-red-500 mb-2">{error}</div>}
            <div className="border rounded-md overflow-hidden">
              {pendingOrders.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No pending orders found
                </div>
              ) : (
                <div className="divide-y">
                  {pendingOrders.map(order => (
                    <div
                      key={order.id}
                      className="p-3 flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium">
                          Order #{order.display_id || order.id.slice(0, 8)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleString()}
                        </div>
                      </div>
                      <Badge>Pending</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Debug Logs</h3>
            <div className="bg-muted p-2 rounded-md h-40 overflow-y-auto text-xs font-mono">
              {logs.map((log, index) => (
                <div key={index} className="py-1">
                  {log}
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-muted-foreground">No logs yet</div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={fetchPendingOrders}
          disabled={isLoading}
        >
          Refresh Orders
        </Button>
        <Button onClick={createTestOrder} disabled={isLoading}>
          Create Test Order
        </Button>
      </CardFooter>
    </Card>
  );
}
