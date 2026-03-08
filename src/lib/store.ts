// Reactive data store for TrailerRent
import { mockTrailers, mockClients, mockRentals, mockMaintenance, mockModels } from './mock-data';
import type { TrailerUnit, Client, Rental, MaintenanceRecord, TrailerModel } from './mock-data';

// Deep clone initial data so mutations don't affect imports
let trailers: TrailerUnit[] = JSON.parse(JSON.stringify(mockTrailers));
let clients: Client[] = JSON.parse(JSON.stringify(mockClients));
let rentals: Rental[] = JSON.parse(JSON.stringify(mockRentals));
let maintenance: MaintenanceRecord[] = JSON.parse(JSON.stringify(mockMaintenance));
let models: TrailerModel[] = JSON.parse(JSON.stringify(mockModels));

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(fn => fn());
}

export const store = {
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  // Getters
  getTrailers: () => trailers,
  getClients: () => clients,
  getRentals: () => rentals,
  getMaintenance: () => maintenance,
  getModels: () => models,

  getTrailerById: (id: string) => trailers.find(t => t.id === id),
  getClientById: (id: string) => clients.find(c => c.id === id),
  getModelById: (id: string) => models.find(m => m.id === id),

  // Add rental + update trailer status + accumulate km
  addRental(data: Omit<Rental, 'id' | 'createdAt'>) {
    const rental: Rental = {
      ...data,
      id: 'r' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    rentals = [rental, ...rentals];
    // Mark trailer as rented
    trailers = trailers.map(t =>
      t.id === data.trailerId ? { ...t, status: 'rented' as const } : t
    );
    notify();
    return rental;
  },

  completeRental(rentalId: string, actualKm?: number) {
    const rental = rentals.find(r => r.id === rentalId);
    if (!rental) return;
    const km = actualKm ?? rental.estimatedKm;
    rentals = rentals.map(r =>
      r.id === rentalId ? { ...r, status: 'completed' as const } : r
    );
    // Add km to trailer and free it
    trailers = trailers.map(t =>
      t.id === rental.trailerId
        ? { ...t, status: 'available' as const, totalKm: t.totalKm + km }
        : t
    );
    notify();
  },

  cancelRental(rentalId: string) {
    const rental = rentals.find(r => r.id === rentalId);
    if (!rental) return;
    rentals = rentals.map(r =>
      r.id === rentalId ? { ...r, status: 'cancelled' as const } : r
    );
    trailers = trailers.map(t =>
      t.id === rental.trailerId ? { ...t, status: 'available' as const } : t
    );
    notify();
  },

  addClient(data: Omit<Client, 'id' | 'score' | 'totalRentals' | 'lateReturns'>) {
    const client: Client = {
      ...data,
      id: 'c' + Date.now(),
      score: 100,
      totalRentals: 0,
      lateReturns: 0,
    };
    clients = [client, ...clients];
    notify();
    return client;
  },

  addTrailer(data: Omit<TrailerUnit, 'id' | 'totalKm' | 'lastMaintenanceKm' | 'nextMaintenanceKm'> & { nextMaintenanceKm?: number }) {
    const trailer: TrailerUnit = {
      ...data,
      id: 't' + Date.now(),
      totalKm: 0,
      lastMaintenanceKm: 0,
      nextMaintenanceKm: data.nextMaintenanceKm ?? 5000,
    };
    trailers = [trailer, ...trailers];
    notify();
    return trailer;
  },

  addMaintenance(data: Omit<MaintenanceRecord, 'id'>) {
    const record: MaintenanceRecord = {
      ...data,
      id: 'mt' + Date.now(),
    };
    maintenance = [record, ...maintenance];
    // Update trailer km tracking
    trailers = trailers.map(t =>
      t.id === data.trailerId
        ? {
            ...t,
            lastMaintenanceKm: data.km,
            nextMaintenanceKm: data.km + (t.nextMaintenanceKm - t.lastMaintenanceKm),
            status: 'available' as const,
          }
        : t
    );
    notify();
    return record;
  },

  // Notifications
  getNotifications() {
    const today = new Date();
    const notifications: { id: string; type: 'warning' | 'info' | 'danger'; title: string; message: string; date: string }[] = [];

    // Rentals ending soon (within 2 days) or overdue
    rentals.filter(r => r.status === 'active').forEach(r => {
      const end = new Date(r.endDate);
      const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const client = clients.find(c => c.id === r.clientId);
      const trailer = trailers.find(t => t.id === r.trailerId);

      if (diffDays < 0) {
        notifications.push({
          id: 'n-overdue-' + r.id,
          type: 'danger',
          title: 'Aluguel Vencido!',
          message: `${client?.name} - ${trailer?.plate} venceu há ${Math.abs(diffDays)} dia(s)`,
          date: r.endDate,
        });
      } else if (diffDays <= 2) {
        notifications.push({
          id: 'n-expiring-' + r.id,
          type: 'warning',
          title: 'Aluguel Vencendo',
          message: `${client?.name} - ${trailer?.plate} vence em ${diffDays} dia(s)`,
          date: r.endDate,
        });
      }
    });

    // Upcoming rentals starting soon (next client arriving)
    rentals.filter(r => r.status === 'active').forEach(r => {
      const start = new Date(r.startDate);
      const diffDays = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const client = clients.find(c => c.id === r.clientId);

      if (diffDays >= 0 && diffDays <= 1) {
        notifications.push({
          id: 'n-arriving-' + r.id,
          type: 'info',
          title: 'Cliente Chegando',
          message: `${client?.name} ${diffDays === 0 ? 'chega hoje' : 'chega amanhã'}`,
          date: r.startDate,
        });
      }
    });

    // Maintenance alerts
    trailers.forEach(t => {
      const progress = ((t.totalKm - t.lastMaintenanceKm) / (t.nextMaintenanceKm - t.lastMaintenanceKm)) * 100;
      if (progress >= 80) {
        notifications.push({
          id: 'n-maint-' + t.id,
          type: progress >= 95 ? 'danger' : 'warning',
          title: 'Manutenção Próxima',
          message: `${t.plate} está em ${Math.round(progress)}% do limite (${t.totalKm.toLocaleString()}/${t.nextMaintenanceKm.toLocaleString()} km)`,
          date: new Date().toISOString(),
        });
      }
    });

    return notifications.sort((a, b) => {
      const priority = { danger: 0, warning: 1, info: 2 };
      return priority[a.type] - priority[b.type];
    });
  },
};
