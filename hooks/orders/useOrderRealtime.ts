// hooks/orders/useOrderRealtime.ts
// DEPRECATED: Use RealtimeProvider instead
// This hook is kept for backward compatibility but should not be used

import { useEffect, useRef, useState, useCallback } from "react";
import { useRealtime } from "@/lib/supabase/realtime-provider";

interface UseOrderRealtimeProps {
  onOrdersChange: (payload?: any) => void;
  enabled?: boolean;
}

interface UseOrderRealtimeReturn {
  connectionStatus: string;
  isSubscribed: boolean;
  realtimeEnabled: boolean;
  retryCount: number;
}

/**
 * @deprecated Use RealtimeProvider with useRealtime hook instead
 */
export function useOrderRealtime({
  onOrdersChange,
  enabled = true,
}: UseOrderRealtimeProps): UseOrderRealtimeReturn {
  const { isConnected, connectionStatus, subscribeToOrders } = useRealtime();
  const [retryCount] = useState(0);

  // Subscribe to orders using the new provider
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = subscribeToOrders((order, event) => {
      // Transform to match old payload format for backward compatibility
      const payload = {
        eventType: event,
        new: event === 'DELETE' ? null : order,
        old: event === 'INSERT' ? null : order,
      };
      onOrdersChange(payload);
    });

    return unsubscribe;
  }, [enabled, subscribeToOrders, onOrdersChange]);

  return {
    connectionStatus,
    isSubscribed: isConnected,
    realtimeEnabled: true,
    retryCount,
  };
}
