'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MinimalTestPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [status, setStatus] = useState('Not connected');
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    console.log('🧪 Starting minimal real-time test...');
    
    // Create a direct subscription without our RealtimeProvider
    const channel = supabase
      .channel('minimal-test-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('🎯 DIRECT EVENT RECEIVED:', payload);
          setEvents(prev => [{
            ...payload,
            timestamp: new Date().toISOString()
          }, ...prev.slice(0, 9)]);
        }
      )
      .subscribe((status, error) => {
        console.log('🔗 Direct subscription status:', status, error);
        setStatus(status);
      });

    return () => {
      console.log('🧹 Cleaning up minimal test');
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const createDirectOrder = async () => {
    try {
      console.log('📝 Creating order directly via client...');
      
      const { data, error } = await supabase
        .from('orders')
        .insert({
          status: 'pending',
          total_amount: 123.45,
          type: 'direct-test',
          display_id: `DIRECT-${Date.now()}`,
          profile_id: '8909a357-b456-4532-8f60-6f6505be398f',
          customer_profile_id: '8909a357-b456-4532-8f60-6f6505be398f'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Direct order creation failed:', error);
      } else {
        console.log('✅ Direct order created:', data);
      }
    } catch (err) {
      console.error('❌ Direct order error:', err);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Minimal Real-time Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Direct Supabase Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p><strong>Status:</strong> {status}</p>
            
            <Button onClick={createDirectOrder} className="w-full">
              Create Order Directly (Bypass RealtimeProvider)
            </Button>
            
            <div className="text-xs text-muted-foreground">
              This bypasses our RealtimeProvider and connects directly to Supabase.
              If this works, the issue is in our RealtimeProvider.
              If this doesn&apos;t work, the issue is with Supabase real-time itself.
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Direct Events ({events.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-muted-foreground">No events received yet...</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {events.map((event, index) => (
                <div key={index} className="bg-green-50 p-3 rounded text-xs">
                  <div><strong>Event:</strong> {event.eventType}</div>
                  <div><strong>Time:</strong> {event.timestamp}</div>
                  <div><strong>Order ID:</strong> {event.new?.id || event.old?.id}</div>
                  <div><strong>Status:</strong> {event.new?.status || event.old?.status}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-yellow-50 rounded-md">
        <h3 className="font-semibold mb-2">What this tests:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Direct connection to Supabase real-time (bypassing our provider)</li>
          <li>Whether RLS policies are blocking real-time events</li>
          <li>Whether the issue is in our code vs Supabase configuration</li>
        </ul>
      </div>
    </div>
  );
}