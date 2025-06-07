"use client";

import { useRealtime } from "@/lib/supabase/realtime-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function RealtimeDebug() {
  const { isConnected, connectionStatus, userId, userRole, subscribeToOrders } = useRealtime();
  const [realtimeEvents, setRealtimeEvents] = useState<any[]>([]);
  const [isCreatingTestOrder, setIsCreatingTestOrder] = useState(false);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [isTestingPermissions, setIsTestingPermissions] = useState(false);

  const createTestOrder = async () => {
    if (!userId) return;
    
    setIsCreatingTestOrder(true);
    const supabase = createClient();
    
    try {
      console.log('[RealtimeDebug] Attempting to create order with userId:', userId);
      
      const { data, error } = await supabase
        .from('orders')
        .insert({
          customer_profile_id: userId,
          profile_id: userId,
          total_amount: 99.99,
          status: 'pending',
          type: 'test',
          display_id: `TEST-${Date.now().toString().slice(-6)}`,
        })
        .select()
        .single();

      if (error) {
        console.error('[RealtimeDebug] Error creating test order:', error);
        console.error('[RealtimeDebug] Error details:', JSON.stringify(error, null, 2));
      } else {
        console.log('[RealtimeDebug] Test order created:', data);
      }
    } catch (error) {
      console.error('[RealtimeDebug] Failed to create test order:', error);
    } finally {
      setIsCreatingTestOrder(false);
    }
  };

  const updateExistingOrder = async () => {
    if (!userId) return;
    
    setIsUpdatingOrder(true);
    const supabase = createClient();
    
    try {
      // Find a pending order to update
      const { data: orders, error: fetchError } = await supabase
        .from('orders')
        .select('id')
        .eq('status', 'pending')
        .limit(1);

      if (fetchError) {
        console.error('[RealtimeDebug] Error fetching orders:', fetchError);
        return;
      }

      if (!orders || orders.length === 0) {
        console.log('[RealtimeDebug] No pending orders found to update');
        return;
      }

      const orderId = orders[0].id;
      console.log('[RealtimeDebug] Updating order:', orderId);

      // Update the order status
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('[RealtimeDebug] Error updating order:', error);
        console.error('[RealtimeDebug] Update error details:', JSON.stringify(error, null, 2));
      } else {
        console.log('[RealtimeDebug] Order updated successfully:', data);
      }
    } catch (error) {
      console.error('[RealtimeDebug] Failed to update order:', error);
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  const testPermissions = async () => {
    if (!userId) {
      console.log('[RealtimeDebug] No userId available');
      return;
    }
    
    setIsTestingPermissions(true);
    const supabase = createClient();
    
    try {
      console.log('[RealtimeDebug] Testing read permissions for userId:', userId);
      
      // Test read permission
      try {
        const { data: readData, error: readError } = await supabase
          .from('orders')
          .select('id, status')
          .limit(1);

        if (readError) {
          console.log('[RealtimeDebug] Read permission error:', JSON.stringify(readError, null, 2));
        } else {
          console.log('[RealtimeDebug] Read permission OK, found orders:', readData?.length || 0);
        }
      } catch (readErr) {
        console.log('[RealtimeDebug] Read test exception:', readErr);
      }

      // Test current user info
      try {
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError) {
          console.log('[RealtimeDebug] Auth error:', JSON.stringify(authError, null, 2));
        } else {
          console.log('[RealtimeDebug] Current user ID:', data?.user?.id);
          console.log('[RealtimeDebug] User email:', data?.user?.email);
        }
      } catch (authErr) {
        console.log('[RealtimeDebug] Auth test exception:', authErr);
      }

      // Test profile lookup
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.log('[RealtimeDebug] Profile lookup error:', JSON.stringify(profileError, null, 2));
        } else {
          console.log('[RealtimeDebug] Profile found:', profileData);
        }
      } catch (profileErr) {
        console.log('[RealtimeDebug] Profile test exception:', profileErr);
      }

    } catch (error) {
      console.log('[RealtimeDebug] Permission test failed:', error);
    } finally {
      setIsTestingPermissions(false);
    }
  };

  useEffect(() => {
    console.log('[RealtimeDebug] Setting up test subscription');
    
    const handleTestUpdate = (order: any, event: string) => {
      console.log('[RealtimeDebug] Received test update:', event, order);
      setRealtimeEvents(prev => [
        { event, order: { id: order.id, status: order.status }, timestamp: new Date().toISOString() },
        ...prev.slice(0, 9) // Keep last 10 events
      ]);
    };

    const unsubscribe = subscribeToOrders(handleTestUpdate);

    return unsubscribe;
  }, [subscribeToOrders]);

  return (
    <div className="p-4 border rounded-lg bg-gray-50 space-y-2">
      <h3 className="font-semibold">Realtime Debug</h3>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <strong>Connection:</strong> 
          <Badge variant={isConnected ? "default" : "destructive"} className="ml-2">
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
        <div>
          <strong>Status:</strong> {connectionStatus}
          {connectionStatus === 'POLLING' && (
            <Badge variant="secondary" className="ml-2">Fallback Mode</Badge>
          )}
        </div>
        <div>
          <strong>User ID:</strong> {userId || 'None'}
        </div>
        <div>
          <strong>User Role:</strong> {userRole || 'None'}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <strong>Recent Events:</strong>
          <div className="flex gap-1 flex-wrap">
            <Button 
              onClick={testPermissions} 
              disabled={isTestingPermissions || !userId}
              size="sm"
              variant="secondary"
            >
              {isTestingPermissions ? 'Testing...' : 'Test Permissions'}
            </Button>
            <Button 
              onClick={updateExistingOrder} 
              disabled={isUpdatingOrder || !userId}
              size="sm"
              variant="outline"
            >
              {isUpdatingOrder ? 'Updating...' : 'Update Order'}
            </Button>
            <Button 
              onClick={createTestOrder} 
              disabled={isCreatingTestOrder || !userId}
              size="sm"
              variant="outline"
            >
              {isCreatingTestOrder ? 'Creating...' : 'Create Order'}
            </Button>
          </div>
        </div>
        
        {realtimeEvents.length === 0 ? (
          <div className="text-gray-500 text-sm">No events received yet - Try creating a test order</div>
        ) : (
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {realtimeEvents.map((event, index) => (
              <div key={index} className="text-xs bg-white p-2 rounded border">
                <span className="font-mono text-green-600">{event.event}</span> - 
                Order {event.order.id.slice(0, 8)} ({event.order.status}) - 
                <span className="text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}