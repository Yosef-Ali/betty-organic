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
import { useAuth } from '@/hooks/useAuth';

export function NotificationTester() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const { user } = useAuth();

  const createTestOrder = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      // Get the authenticated user securely
      const supabase = createClient();
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(`Authentication error: ${authError.message}`);
      }

      if (!authUser) {
        setResult({
          success: false,
          message: 'You must be logged in to create a test order',
        });
        return;
      }

      // Use the server action to create a test order with the authenticated user ID
      const result = await createTestPendingOrder(authUser.id);

      if (!result.success) {
        throw new Error(result.error as string);
      }

      setResult({
        success: true,
        message: `Test order created successfully! ID: ${
          result.order?.id || 'unknown'
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
      // Use the server action to fetch pending orders
      const result = await getPendingOrders();
      setPendingOrders(result.orders || []);

      // Log the count for debugging
      console.log(`[DEBUG] Found ${result.count} pending orders`);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    }
  };

  // Fetch pending orders on component mount and when user changes
  useEffect(() => {
    fetchPendingOrders();

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
