import { useSyncExternalStore, useCallback } from 'react';
import { store } from '@/lib/store';
import type { PermissionPage } from '@/lib/store';
import type { Employee } from '@/lib/mock-data';

interface StoreSnapshot {
  trailers: ReturnType<typeof store.getTrailers>;
  clients: ReturnType<typeof store.getClients>;
  rentals: ReturnType<typeof store.getRentals>;
  maintenance: ReturnType<typeof store.getMaintenance>;
  models: ReturnType<typeof store.getModels>;
  notifications: ReturnType<typeof store.getNotifications>;
  employeePermissions: Set<PermissionPage>;
  employees: Employee[];
}

let cachedSnapshot: StoreSnapshot | null = null;
let cachedArrays: [any, any, any, any, any, any, any] | null = null;

function getSnapshot(): StoreSnapshot {
  const t = store.getTrailers();
  const c = store.getClients();
  const r = store.getRentals();
  const m = store.getMaintenance();
  const mo = store.getModels();
  const ep = store.getEmployeePermissions();
  const em = store.getEmployees();

  if (
    cachedArrays &&
    cachedArrays[0] === t &&
    cachedArrays[1] === c &&
    cachedArrays[2] === r &&
    cachedArrays[3] === m &&
    cachedArrays[4] === mo &&
    cachedArrays[5] === ep &&
    cachedArrays[6] === em &&
    cachedSnapshot
  ) {
    return cachedSnapshot;
  }

  cachedArrays = [t, c, r, m, mo, ep, em];
  cachedSnapshot = {
    trailers: t,
    clients: c,
    rentals: r,
    maintenance: m,
    models: mo,
    notifications: store.getNotifications(),
    employeePermissions: ep,
    employees: em,
  };
  return cachedSnapshot;
}

export function useStore() {
  const subscribe = useCallback((cb: () => void) => store.subscribe(cb), []);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
