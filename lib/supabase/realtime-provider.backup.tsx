"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type OrderStatus = "pending" | "confirmed" | "in_progress" | "ready" | "completed" | "cancelled";

interface RealtimeOrder {
  id: string;
  status: OrderStatus;
  customer_profile_id: string;
  total_amount: number;
  created_at: string;
  display_id?: string;
}

interface RealtimeContextType {
  isConnected: boolean;
  connectionStatus: string;
  userId?: string;
  userRole?: 'admin' | 'sales' | 'customer';
  subscribeToOrders: (callback: (order: RealtimeOrder, event: 'INSERT' | 'UPDATE' | 'DELETE') => void) => () => void;
  unsubscribeFromOrders: (callback: Function) => void;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

interface RealtimeProviderProps {
  children: React.ReactNode;
  userId?: string;
  userRole?: 'admin' | 'sales' | 'customer';
}

export function RealtimeProvider({ children, userId, userRole }: RealtimeProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("CONNECTING");
  const [usePollingFallback, setUsePollingFallback] = useState(false);
  
  const supabaseRef = useRef<SupabaseClient<Database> | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const subscribersRef = useRef<Set<Function>>(new Set());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const lastPolledDataRef = useRef<any[]>([]);

  const MAX_RECONNECT_ATTEMPTS = 3; // Reduced attempts
  const RECONNECT_DELAY_BASE = 1000;
  const POLLING_INTERVAL = 60000; // 60 seconds (increased to reduce frequency)

  // Initialize Supabase client
  useEffect(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
  }, []);

  // Polling fallback function
  const startPollingFallback = useCallback(async () => {
    if (!supabaseRef.current || !userId) return;

    setUsePollingFallback(true);
    setIsConnected(true); // Consider polling as "connected"
    setConnectionStatus('POLLING');

    const pollOrders = async () => {
      try {
        let query = supabaseRef.current!.from('orders').select('*');
        
        // Apply same filtering logic as realtime
        if (userRole === 'customer' && userId) {
          query = query.eq('customer_profile_id', userId);
        } else if (userRole === 'sales') {
          query = query.in('status', ['pending', 'new', 'processing']);
        }
        // Admin gets all orders (no filter)

        const { data: currentOrders, error } = await query
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          return;
        }

        // Compare with last polled data to detect changes
        const lastData = lastPolledDataRef.current;
        
        if (currentOrders && currentOrders.length > 0) {
          // Find new orders (not in last data)
          const newOrders = currentOrders.filter(order => 
            !lastData.find(lastOrder => lastOrder.id === order.id)
          );

          // Find updated orders (in both but with different timestamps)
          const updatedOrders = currentOrders.filter(order => {
            const lastOrder = lastData.find(lastOrder => lastOrder.id === order.id);
            return lastOrder && 
              new Date(order.updated_at || order.created_at).getTime() > 
              new Date(lastOrder.updated_at || lastOrder.created_at).getTime();
          });

          // Notify subscribers of new orders
          newOrders.forEach(order => {
            subscribersRef.current.forEach(callback => {
              try {
                callback(order as RealtimeOrder, 'INSERT');
              } catch (error) {
                // Silently handle callback errors
              }
            });
          });

          // Notify subscribers of updated orders
          updatedOrders.forEach(order => {
            subscribersRef.current.forEach(callback => {
              try {
                callback(order as RealtimeOrder, 'UPDATE');
              } catch (error) {
                // Silently handle callback errors
              }
            });
          });

          lastPolledDataRef.current = currentOrders;
        }
      } catch (error) {
        // Silently handle polling errors
      }

      // Schedule next poll
      if (usePollingFallback && pollingTimeoutRef.current === null) {
        pollingTimeoutRef.current = setTimeout(() => {
          pollingTimeoutRef.current = null;
          pollOrders();
        }, POLLING_INTERVAL);
      }
    };

    // Start first poll
    pollOrders();
  }, [userId, userRole, usePollingFallback]);

  // Setup realtime subscription
  const setupRealtimeSubscription = useCallback(() => {
    if (!supabaseRef.current || !userId || !userRole) {
      console.log('[RealtimeProvider] Skipping setup - missing user data');
      return;
    }

    // Clean up existing channel
    if (channelRef.current) {
      console.log('[RealtimeProvider] Cleaning up existing channel');
      supabaseRef.current.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Simpler channel name
    const channelName = `orders-${userRole}-${userId}`;
    
    // Filter logic based on user role
    let subscriptionFilter = {};
    if (userRole === 'customer') {
      subscriptionFilter = { filter: `customer_profile_id=eq.${userId}` };
    }
    // Admin and sales get no filter (all orders)
    
    console.log(`[RealtimeProvider] Setting up channel: ${channelName}`);
    console.log(`[RealtimeProvider] User: ${userId}, Role: ${userRole}`);
    
    const channel = supabaseRef.current
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          ...subscriptionFilter
        },
        (payload) => {
          console.log(`[RealtimeProvider] ✅ Event received:`, {
            eventType: payload.eventType,
            table: payload.table,
            new: payload.new,
            old: payload.old
          });
          
          const { eventType, new: newRecord, old: oldRecord } = payload;
          const record = newRecord || oldRecord;
          
          if (!record) {
            console.log('[RealtimeProvider] ❌ No record in event');
            return;
          }

          // Notify all subscribers
          console.log(`[RealtimeProvider] 📢 Notifying ${subscribersRef.current.size} subscribers`);
          subscribersRef.current.forEach((callback, index) => {
            try {
              console.log(`[RealtimeProvider] 📞 Calling subscriber ${index + 1}/${subscribersRef.current.size}`);
              if (eventType === 'INSERT' && newRecord) {
                console.log(`[RealtimeProvider] 🔄 Calling INSERT callback with:`, newRecord);
                callback(newRecord as RealtimeOrder, 'INSERT');
              } else if (eventType === 'UPDATE' && newRecord) {
                console.log(`[RealtimeProvider] 🔄 Calling UPDATE callback with:`, newRecord);
                callback(newRecord as RealtimeOrder, 'UPDATE');
              } else if (eventType === 'DELETE' && oldRecord) {
                console.log(`[RealtimeProvider] 🔄 Calling DELETE callback with:`, oldRecord);
                callback(oldRecord as RealtimeOrder, 'DELETE');
              }
              console.log(`[RealtimeProvider] ✅ Subscriber ${index + 1} callback completed`);
            } catch (error) {
              console.error(`[RealtimeProvider] ❌ Error in subscriber ${index + 1} callback:`, error);
            }
          });
        }
      )
      .subscribe((status, error) => {
        console.log(`[RealtimeProvider] 🔗 Status: ${status}`, error ? `Error: ${error.message}` : '');
        setConnectionStatus(status);
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          reconnectAttemptsRef.current = 0;
          console.log(`[RealtimeProvider] ✅ Successfully subscribed to: ${channelName}`);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false);
          console.log(`[RealtimeProvider] ❌ Connection failed: ${status}`);
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          console.log(`[RealtimeProvider] ⏹️ Channel closed`);
        }
      });

    channelRef.current = channel;
  }, [userId, userRole]);

  // Initialize connection
  useEffect(() => {
    console.log('[RealtimeProvider] 🚀 Initializing with:', { userId, userRole });
    setupRealtimeSubscription();

    return () => {
      console.log('[RealtimeProvider] 🧹 Cleaning up');
      if (supabaseRef.current && channelRef.current) {
        supabaseRef.current.removeChannel(channelRef.current);
      }
      subscribersRef.current.clear();
    };
  }, [setupRealtimeSubscription]);

  // Subscribe to order updates
  const subscribeToOrders = useCallback((
    callback: (order: RealtimeOrder, event: 'INSERT' | 'UPDATE' | 'DELETE') => void
  ) => {
    subscribersRef.current.add(callback);
    
    // Return unsubscribe function
    return () => {
      subscribersRef.current.delete(callback);
    };
  }, []);

  // Unsubscribe from order updates
  const unsubscribeFromOrders = useCallback((callback: Function) => {
    subscribersRef.current.delete(callback);
  }, []);

  const contextValue: RealtimeContextType = {
    isConnected,
    connectionStatus,
    userId,
    userRole,
    subscribeToOrders,
    unsubscribeFromOrders,
  };

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}