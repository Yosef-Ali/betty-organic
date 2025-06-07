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

  const supabaseRef = useRef<SupabaseClient<Database> | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const subscribersRef = useRef<Set<Function>>(new Set());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY_BASE = 2000;

  // Initialize Supabase client
  useEffect(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
  }, []);

  // Setup realtime subscription
  const setupRealtimeSubscription = useCallback(() => {
    if (!supabaseRef.current) {
      console.log('[RealtimeProvider] Skipping setup - no Supabase client');
      return;
    }

    // Clean up existing channel
    if (channelRef.current) {
      console.log('[RealtimeProvider] Cleaning up existing channel');
      supabaseRef.current.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Cancel any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Create unique channel name - simplified for better reliability
    const channelName = `orders-realtime-${Date.now()}`;

    console.log(`[RealtimeProvider] Setting up channel: ${channelName}`);
    console.log(`[RealtimeProvider] User: ${userId || 'anonymous'}, Role: ${userRole || 'unknown'}`);

    // Create channel with simplified configuration
    const channel = supabaseRef.current.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: userId || 'anonymous' }
      }
    });

    // Subscribe to postgres changes - remove filters to get all events
    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log(`[RealtimeProvider] Raw event received:`, payload);

          const { eventType, new: newRecord, old: oldRecord } = payload;
          const record = newRecord || oldRecord;

          if (!record) {
            console.log('[RealtimeProvider] No record data in payload');
            return;
          }

          // Apply client-side filtering based on role if we have user context
          let shouldProcess = true; // Default to true, let components handle filtering

          if (userId && userRole) {
            if (userRole === 'customer') {
              // Customer only sees their own orders
              shouldProcess = (record as any).customer_profile_id === userId;
            } else if (userRole === 'sales' || userRole === 'admin') {
              // Sales and admin see all orders
              shouldProcess = true;
            }

            if (!shouldProcess) {
              console.log('[RealtimeProvider] Skipping event - not relevant for user role');
              return;
            }
          } else {
            console.log('[RealtimeProvider] No user context - processing all events');
          }

          // Notify all subscribers
          subscribersRef.current.forEach((callback) => {
            try {
              if (eventType === 'INSERT' && newRecord) {
                callback(newRecord as RealtimeOrder, 'INSERT');
              } else if (eventType === 'UPDATE' && newRecord) {
                callback(newRecord as RealtimeOrder, 'UPDATE');
              } else if (eventType === 'DELETE' && oldRecord) {
                callback(oldRecord as RealtimeOrder, 'DELETE');
              }
            } catch (error) {
              console.error('[RealtimeProvider] Error in subscriber callback:', error);
            }
          });
        }
      )
      .subscribe((status, error) => {
        console.log(`[RealtimeProvider] Channel status: ${status}`, error ? `Error: ${error.message}` : '');
        setConnectionStatus(status);

        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          reconnectAttemptsRef.current = 0;
          console.log(`[RealtimeProvider] Successfully subscribed`);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false);
          handleReconnect();
        } else if (status === 'CLOSED') {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;
  }, [userId, userRole]);

  // Handle reconnection with exponential backoff
  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.log('[RealtimeProvider] Max reconnection attempts reached');
      return;
    }

    const delay = RECONNECT_DELAY_BASE * Math.pow(2, reconnectAttemptsRef.current);
    reconnectAttemptsRef.current++;

    console.log(`[RealtimeProvider] Scheduling reconnect attempt ${reconnectAttemptsRef.current} in ${delay}ms`);

    reconnectTimeoutRef.current = setTimeout(() => {
      setupRealtimeSubscription();
    }, delay);
  }, [setupRealtimeSubscription]);

  // Initialize connection - work even without user context initially
  useEffect(() => {
    console.log('[RealtimeProvider] Initializing with:', { userId: userId || 'none', userRole: userRole || 'none' });

    // Always try to setup subscription, even without user context
    // This allows the system to receive events and let components filter
    setupRealtimeSubscription();

    return () => {
      console.log('[RealtimeProvider] Cleaning up');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
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
    console.log('[RealtimeProvider] Adding subscriber');
    subscribersRef.current.add(callback);

    // Return unsubscribe function
    return () => {
      console.log('[RealtimeProvider] Removing subscriber');
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
