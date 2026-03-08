import { useSyncExternalStore, useCallback } from 'react';
import { store } from '@/lib/store';

export function useStore() {
  const subscribe = useCallback((cb: () => void) => store.subscribe(cb), []);
  // Trigger re-render on any store change
  const getSnapshot = useCallback(() => ({
    trailers: store.getTrailers(),
    clients: store.getClients(),
    rentals: store.getRentals(),
    maintenance: store.getMaintenance(),
    models: store.getModels(),
    notifications: store.getNotifications(),
  }), []);

  return useSyncExternalStore(subscribe, getSnapshot);
}
