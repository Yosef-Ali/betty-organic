'use client';

import React, { useState, useEffect } from 'react';
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
  createTestPendingOrderForDebug,
  getPendingOrdersForDebug,
} from '@/app/actions/testActions';

export default function NotificationDebugPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPendingOrders = async () => {
    try {
      const result = await getPendingOrdersForDebug();
      if (result.success) {
        setPendingOrders(result.orders || []);
        setPendingCount(result.count || 0);
      } else {
        console.error('Error fetching pending orders:', result.error);
      }
    } catch (error) {
      console.error('Failed to fetch pending orders:', error);
    }
  };

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

  // Fetch pending orders on component mount
  useEffect(() => {
    fetchPendingOrders();

    // Set up a polling interval to periodically check for new orders
    const interval = setInterval(fetchPendingOrders, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Notification Bell Debug</h1>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              This page allows you to test the notification bell by creating
              test orders using admin privileges. Watch the notification bell in
              the header to see it update in real-time.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Test Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result && (
              <Alert variant={result.success ? 'default' : 'destructive'}>
                <AlertTitle>{result.success ? 'Success' : 'Error'}</AlertTitle>
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            )}

            <p className="text-sm text-muted-foreground">
              This will create a test pending order using admin privileges to
              bypass RLS policies. The notification bell should update to show
              the new order.
            </p>
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

        <Card>
          <CardHeader>
            <CardTitle>Pending Orders ({pendingCount})</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No pending orders
              </p>
            ) : (
              <div className="space-y-2">
                {pendingOrders.map(order => (
                  <div key={order.id} className="border p-3 rounded-md">
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {order.display_id || `Order #${order.id.slice(0, 8)}`}
                      </span>
                      <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                        {order.status}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Created: {new Date(order.created_at).toLocaleString()}
                    </div>
                    {order.total_amount && (
                      <div className="text-sm font-medium mt-1">
                        ETB {order.total_amount.toFixed(2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={fetchPendingOrders}
              variant="outline"
              className="w-full"
            >
              Refresh Orders
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Instructions</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            Click the "Create Test Order" button to create a test pending order
          </li>
          <li>
            The notification bell in the header should update to show the new
            order count
          </li>
          <li>
            Click on the notification bell to see the list of pending orders
          </li>
          <li>You should hear a notification sound if sound is enabled</li>
        </ol>
      </div>
    </div>
  );
}
