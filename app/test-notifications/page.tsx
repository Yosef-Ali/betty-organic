'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { createTestPendingOrderForDebug, getPendingOrdersForDebug } from '@/app/actions/testActions';

export default function TestNotificationsPage() {
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Function to create a test order
  const createTestOrder = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const result = await createTestPendingOrderForDebug();
      
      if (!result.success) {
        throw new Error(result.error as string);
      }
      
      setMessage(`Test order created successfully! ID: ${result.order?.id || 'unknown'}`);
      fetchPendingOrders();
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to fetch pending orders
  const fetchPendingOrders = async () => {
    try {
      const result = await getPendingOrdersForDebug();
      
      if (!result.success) {
        throw new Error(result.error as string);
      }
      
      setPendingOrders(result.orders || []);
      console.log(`Found ${result.count} pending orders`);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      setMessage(`Error fetching orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Set up realtime subscription
  useEffect(() => {
    const supabase = createClient();
    
    // Fetch initial data
    fetchPendingOrders();
    
    // Set up realtime subscription
    const channel = supabase.channel('public:orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: 'status=eq.pending'
      }, (payload) => {
        console.log('Order change detected:', payload);
        fetchPendingOrders();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Notification System Test</h1>
      <p className="mb-6">
        This page allows you to test the notification system without requiring authentication.
      </p>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {message && (
              <div className={`p-4 mb-4 rounded ${message.includes('Error') ? 'bg-red-100' : 'bg-green-100'}`}>
                {message}
              </div>
            )}
            
            <div>
              <h3 className="text-lg font-medium mb-2">Pending Orders ({pendingOrders.length})</h3>
              {pendingOrders.length === 0 ? (
                <p className="text-gray-500">No pending orders found</p>
              ) : (
                <div className="space-y-2">
                  {pendingOrders.map(order => (
                    <div key={order.id} className="border p-3 rounded">
                      <div><strong>ID:</strong> {order.id.slice(0, 8)}...</div>
                      <div><strong>Display ID:</strong> {order.display_id || 'N/A'}</div>
                      <div><strong>Created:</strong> {new Date(order.created_at).toLocaleString()}</div>
                      <div><strong>Amount:</strong> ETB {order.total_amount}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={createTestOrder} 
              disabled={isLoading}
              className="mr-2"
            >
              {isLoading ? 'Creating...' : 'Create Test Order'}
            </Button>
            <Button 
              onClick={fetchPendingOrders} 
              variant="outline"
            >
              Refresh Orders
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
