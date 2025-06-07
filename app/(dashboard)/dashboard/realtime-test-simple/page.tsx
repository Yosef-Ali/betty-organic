'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SimpleRealtimeTest() {
  const [events, setEvents] = useState<any[]>([]);
  const [status, setStatus] = useState('Not connected');
  const [isCreating, setIsCreating] = useState(false);
  const supabase = createClient();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    console.log('🧪 [SimpleTest] Setting up direct real-time subscription...');
    
    // Create direct channel (bypass RealtimeProvider)
    const channel = supabase
      .channel('simple-test-' + Date.now())
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('🎯 [SimpleTest] DIRECT EVENT RECEIVED:', payload);
          setEvents(prev => [{
            ...payload,
            timestamp: new Date().toISOString()
          }, ...prev.slice(0, 9)]);
        }
      )
      .subscribe((status, error) => {
        console.log('📶 [SimpleTest] Status:', status, error);
        setStatus(status);
      });

    channelRef.current = channel;

    return () => {
      console.log('🧹 [SimpleTest] Cleaning up');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const createTestOrder = async () => {
    setIsCreating(true);
    try {
      console.log('📦 [SimpleTest] Creating test order...');
      
      const { data, error } = await supabase
        .from('orders')
        .insert({
          profile_id: '8909a357-b456-4532-8f60-6f6505be398f',
          customer_profile_id: '8909a357-b456-4532-8f60-6f6505be398f',
          status: 'pending',
          total_amount: 123.45,
          type: 'sale',
          display_id: 'SIMPLE-' + Math.floor(Math.random() * 10000)
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [SimpleTest] Failed:', error);
      } else {
        console.log('✅ [SimpleTest] Created:', data);
      }
    } catch (err) {
      console.error('❌ [SimpleTest] Error:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Simple Real-time Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Direct Supabase Test (Bypass Provider)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p><strong>Status:</strong> {status}</p>
            
            <Button 
              onClick={createTestOrder} 
              disabled={isCreating || status !== 'SUBSCRIBED'}
              className="w-full"
            >
              {isCreating ? 'Creating...' : 'Create Test Order (Direct)'}
            </Button>
            
            <div className="text-xs text-muted-foreground">
              This bypasses RealtimeProvider and connects directly to test if real-time works in the browser.
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
                  <div><strong>Display ID:</strong> {event.new?.display_id || event.old?.display_id}</div>
                  <div><strong>Status:</strong> {event.new?.status || event.old?.status}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}