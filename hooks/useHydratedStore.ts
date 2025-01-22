import { useState, useEffect } from 'react';
import { StoreApi, UseBoundStore } from 'zustand';

export function useHydratedStore<T>(
  store: UseBoundStore<StoreApi<T>>,
  selector: (state: T) => any,
) {
  const [hydrated, setHydrated] = useState(false);
  const [data, setData] = useState(selector(store.getState()));

  useEffect(() => {
    setHydrated(true);
    // Subscribe to store changes
    const unsubscribe = store.subscribe(state => {
      setData(selector(state));
    });

    return () => {
      unsubscribe();
    };
  }, [store, selector]);

  // Return data only after hydration
  return [hydrated ? data : selector(store.getState()), hydrated] as const;
}
