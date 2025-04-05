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
import { createClient } from '@/lib/supabase/client';

export default function NotificationDebugPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use the regular client instead of admin client
      const supabase = createClient();
      
      // Fetch pending orders
      const { data, error, count } = await supabase
        .from('orders')
        .select('id, status, created_at, total_amount, display_id', {
          count: 'exact',
        })
        .or('status.eq.pending,status.eq.Pending,status.eq.PENDING')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching pending orders:', error);
        setError(`Error fetching orders: ${error.message}`);
        setPendingOrders([]);
        setPendingCount(0);
        return;
      }

      console.log('Pending orders:', data);
      setPendingOrders(data || []);
      setPendingCount(count || 0);
    } catch (err) {
      console.error('Failed to fetch pending orders:', err);
      setError('Failed to fetch pending orders');
      setPendingOrders([]);
      setPendingCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const createTestOrder = async () => {
    try {
      setIsLoading(true);
      setResult(null);
      setError(null);
      
      // Use the regular client instead of admin client
      const supabase = createClient();
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('You must be logged in to create a test order');
        return;
      }
      
      // Create a test order
      const { data, error } = await supabase
        .from('orders')
        .insert({
          profile_id: user.id,
          customer_profile_id: user.id,
          total_amount: 99.99,
          status: 'pending',
          type: 'test',
          display_id: `TEST-${Date.now().toString().slice(-6)}`,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating test order:', error);
        setError(`Error creating test order: ${error.message}`);
        return;
      }

      setResult({
        success: true,
        message: `Created test order with ID: ${data.display_id || data.id}`,
      });
      
      // Refresh the pending orders list
      fetchPendingOrders();
    } catch (err) {
      console.error('Failed to create test order:', err);
      setError('Failed to create test order');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  return (
    <div className="container py-10 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Notification Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              <AlertTitle>{result.success ? 'Success' : 'Error'}</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Pending Orders</h3>
              <span className="text-sm text-muted-foreground">
                {pendingCount} orders
              </span>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pendingOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pending orders found
              </div>
            ) : (
              <div className="space-y-2">
                {pendingOrders.map(order => (
                  <div
                    key={order.id}
                    className="border rounded-md p-4 flex justify-between"
                  >
                    <div>
                      <div className="font-medium">
                        {order.display_id || `Order #${order.id.slice(0, 8)}`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                        {order.status}
                      </span>
                      <span className="ml-4 font-medium">
                        ${order.total_amount?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={fetchPendingOrders}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Refresh Orders'
            )}
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
    </div>
  );
}
