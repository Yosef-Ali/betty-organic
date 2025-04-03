'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';

export default function SimpleTestPage() {
  const [message, setMessage] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Initialize Supabase client with explicit API key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  // Check if environment variables are available
  useEffect(() => {
    if (!supabaseUrl || !supabaseKey) {
      setMessage('Error: Supabase environment variables are missing');
    } else {
      setMessage(`Connected to Supabase at ${supabaseUrl}`);
      fetchPendingOrders();
    }
  }, [supabaseUrl, supabaseKey]);

  // Fetch pending orders
  const fetchPendingOrders = async () => {
    if (!supabaseUrl || !supabaseKey) return;
    
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      setMessage(`Found ${data?.length || 0} pending orders`);
    } catch (error: any) {
      setMessage(`Error fetching orders: ${error.message}`);
      console.error('Fetch error:', error);
    }
  };

  // Create a test order
  const createTestOrder = async () => {
    if (!supabaseUrl || !supabaseKey) return;
    
    setLoading(true);
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Find an admin user
      const { data: admins, error: adminError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);
      
      if (adminError) throw adminError;
      if (!admins || admins.length === 0) {
        setMessage('No admin users found');
        setLoading(false);
        return;
      }
      
      const adminId = admins[0].id;
      
      // Create the test order
      const { data, error } = await supabase
        .from('orders')
        .insert({
          profile_id: adminId,
          customer_profile_id: adminId,
          total_amount: 99.99,
          status: 'pending',
          type: 'test',
          display_id: `TEST-${Date.now().toString().slice(-6)}`,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setMessage(`Test order created: ${data.id}`);
      fetchPendingOrders();
    } catch (error: any) {
      setMessage(`Error creating order: ${error.message}`);
      console.error('Create error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    if (!supabaseUrl || !supabaseKey) return;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const channel = supabase.channel('orders-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: 'status=eq.pending'
      }, () => {
        console.log('Order change detected');
        fetchPendingOrders();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabaseUrl, supabaseKey]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Simple Notification Test</h1>
      
      <div className="mb-4">
        <Button 
          onClick={createTestOrder} 
          disabled={loading || !supabaseUrl || !supabaseKey}
          className="mr-2"
        >
          {loading ? 'Creating...' : 'Create Test Order'}
        </Button>
        
        <Button 
          onClick={fetchPendingOrders} 
          variant="outline"
          disabled={!supabaseUrl || !supabaseKey}
        >
          Refresh Orders
        </Button>
      </div>
      
      <div className="p-4 mb-4 bg-gray-100 rounded">
        <p><strong>Status:</strong> {message}</p>
        <p><strong>Supabase URL:</strong> {supabaseUrl ? 'Available' : 'Missing'}</p>
        <p><strong>Supabase Key:</strong> {supabaseKey ? 'Available' : 'Missing'}</p>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Pending Orders ({orders.length})</h2>
        {orders.length === 0 ? (
          <p>No pending orders found</p>
        ) : (
          <div className="space-y-2">
            {orders.map(order => (
              <div key={order.id} className="border p-3 rounded">
                <div><strong>ID:</strong> {order.id}</div>
                <div><strong>Created:</strong> {new Date(order.created_at).toLocaleString()}</div>
                <div><strong>Amount:</strong> ETB {order.total_amount}</div>
                <div><strong>Status:</strong> {order.status}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
