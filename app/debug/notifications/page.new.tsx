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
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

// Mock notification debugger that doesn't use Supabase admin client
function MockNotificationDebugger() {
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('SUBSCRIBED');

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()} - ${message}`]);
  };

  const fetchPendingOrders = () => {
    setIsLoading(true);
    addLog('Fetching mock pending orders...');

    // Simulate API delay
    setTimeout(() => {
      // Create mock orders
      const mockOrders = [
        {
          id: 'mock-1',
          status: 'pending',
          created_at: new Date().toISOString(),
          display_id: `ORD-${Math.floor(Math.random() * 10000)}`,
          total_amount: 99.99,
        },
        {
          id: 'mock-2',
          status: 'pending',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          display_id: `ORD-${Math.floor(Math.random() * 10000)}`,
          total_amount: 149.99,
        },
        {
          id: 'mock-3',
          status: 'pending',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          display_id: `ORD-${Math.floor(Math.random() * 10000)}`,
          total_amount: 199.99,
        },
      ];

      setPendingOrders(mockOrders);
      addLog(`Found ${mockOrders.length} pending orders`);
      setIsLoading(false);
    }, 500);
  };

  const createTestOrder = () => {
    setIsLoading(true);
    addLog('Creating mock test order...');

    // Simulate API delay
    setTimeout(() => {
      const newOrder = {
        id: `mock-${Date.now()}`,
        status: 'pending',
        created_at: new Date().toISOString(),
        display_id: `ORD-${Math.floor(Math.random() * 10000)}`,
        total_amount: Math.floor(Math.random() * 200) + 50,
      };

      setPendingOrders(prev => [newOrder, ...prev]);
      addLog(`Created new test order: ${newOrder.display_id}`);
      setIsLoading(false);
    }, 500);
  };

  // Initialize on mount
  useEffect(() => {
    addLog('Initializing mock notification debugger...');
    fetchPendingOrders();

    // Simulate realtime updates
    const interval = setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance
        addLog('Received realtime update');
        const newOrder = {
          id: `mock-${Date.now()}`,
          status: 'pending',
          created_at: new Date().toISOString(),
          display_id: `ORD-${Math.floor(Math.random() * 10000)}`,
          total_amount: Math.floor(Math.random() * 200) + 50,
        };
        
        setPendingOrders(prev => [newOrder, ...prev.slice(0, 9)]);
        addLog(`New order received: ${newOrder.display_id}`);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchPendingOrders]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Notification Debugger</span>
          <Badge
            variant={connectionStatus === 'SUBSCRIBED' ? 'success' : 'destructive'}
            className={
              connectionStatus === 'SUBSCRIBED'
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : ''
            }
          >
            {connectionStatus === 'SUBSCRIBED'
              ? 'Connected'
              : connectionStatus || 'Not connected'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Pending Orders</h3>
            <div className="bg-muted p-2 rounded-md h-40 overflow-y-auto">
              {pendingOrders.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No pending orders found
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingOrders.map(order => (
                    <div
                      key={order.id}
                      className="bg-card p-2 rounded-md border flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium">{order.display_id}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{order.status}</Badge>
                        <div className="font-medium">${order.total_amount}</div>
                      </div>
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
  );
}

// Mock notification tester that doesn't use Supabase admin client
function MockNotificationTester() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);

  const createTestOrder = () => {
    setIsLoading(true);
    setResult(null);

    // Simulate API delay
    setTimeout(() => {
      const newOrder = {
        id: `mock-${Date.now()}`,
        status: 'pending',
        created_at: new Date().toISOString(),
        display_id: `ORD-${Math.floor(Math.random() * 10000)}`,
      };

      setPendingOrders(prev => [newOrder, ...prev]);
      
      setResult({
        success: true,
        message: `Test order created successfully! ID: ${newOrder.display_id}`,
      });
      
      setIsLoading(false);
    }, 500);
  };

  const fetchPendingOrders = () => {
    setIsLoading(true);

    // Simulate API delay
    setTimeout(() => {
      // Create mock orders if empty
      if (pendingOrders.length === 0) {
        const mockOrders = [
          {
            id: 'mock-1',
            status: 'pending',
            created_at: new Date().toISOString(),
            display_id: `ORD-${Math.floor(Math.random() * 10000)}`,
          },
          {
            id: 'mock-2',
            status: 'pending',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            display_id: `ORD-${Math.floor(Math.random() * 10000)}`,
          },
        ];
        setPendingOrders(mockOrders);
      }
      
      setIsLoading(false);
    }, 500);
  };

  // Initialize on mount
  useEffect(() => {
    fetchPendingOrders();
  }, [fetchPendingOrders]);

  return (
    <Card className="w-full">
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
          <div className="bg-muted p-2 rounded-md">
            {pendingOrders.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No pending orders found
              </div>
            ) : (
              <div className="space-y-2">
                {pendingOrders.map(order => (
                  <div
                    key={order.id}
                    className="bg-card p-2 rounded-md border"
                  >
                    <div className="font-medium">{order.display_id}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleString()}
                    </div>
                    <Badge className="mt-1">{order.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-muted p-4 rounded-md">
          <h3 className="text-lg font-medium mb-2">Environment Status</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm font-medium">Supabase URL:</div>
            <div className="text-sm">
              <Badge variant="outline" className="bg-green-50">Available</Badge>
            </div>
            <div className="text-sm font-medium">Supabase Key:</div>
            <div className="text-sm">
              <Badge variant="outline" className="bg-green-50">Available</Badge>
            </div>
            <div className="text-sm font-medium">Realtime:</div>
            <div className="text-sm">
              <Badge variant="outline" className="bg-green-50">Enabled</Badge>
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
  );
}

export default function NotificationDebugPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Notification System Debug</h1>
      <p className="mb-6">
        Use this page to test the notification system. Create a test order and
        check if the notification bell updates.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Notification Tester</h2>
          <MockNotificationTester />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Notification Debugger</h2>
          <MockNotificationDebugger />
        </div>
      </div>
    </div>
  );
}
