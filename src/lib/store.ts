// Reactive data store for TrailerRent
import { mockTrailers, mockClients, mockRentals, mockMaintenance, mockModels, mockEmployees, mockSales } from './mock-data';
import type { TrailerUnit, Client, Rental, MaintenanceRecord, TrailerModel, Employee, Sale } from './mock-data';

// Deep clone initial data so mutations don't affect imports
let trailers: TrailerUnit[] = JSON.parse(JSON.stringify(mockTrailers));
let clients: Client[] = JSON.parse(JSON.stringify(mockClients));
let rentals: Rental[] = JSON.parse(JSON.stringify(mockRentals));
let maintenance: MaintenanceRecord[] = JSON.parse(JSON.stringify(mockMaintenance));
let models: TrailerModel[] = JSON.parse(JSON.stringify(mockModels));
let employees: Employee[] = JSON.parse(JSON.stringify(mockEmployees));
let sales: Sale[] = JSON.parse(JSON.stringify(mockSales));

// Employee permissions (configurable by admin)
export type PermissionPage = 'trailers' | 'clients' | 'rentals' | 'calendar' | 'maintenance' | 'financial' | 'reports' | 'sales';
export const ALL_PAGES: { id: PermissionPage; label: string }[] = [
  { id: 'trailers', label: 'Reboques' },
  { id: 'clients', label: 'Clientes' },
  { id: 'rentals', label: 'Aluguéis' },
  { id: 'calendar', label: 'Calendário' },
  { id: 'maintenance', label: 'Manutenção' },
  { id: 'financial', label: 'Financeiro' },
  { id: 'reports', label: 'Relatórios' },
];

// Default: employee can see everything except financial
let employeePermissions: Set<PermissionPage> = new Set(['trailers', 'clients', 'rentals', 'calendar', 'maintenance']);

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
  getEmployeePermissions: () => employeePermissions,
  getEmployees: () => employees,
  getSales: () => sales,

  getTrailerById: (id: string) => trailers.find(t => t.id === id),
  getClientById: (id: string) => clients.find(c => c.id === id),
  getModelById: (id: string) => models.find(m => m.id === id),

  // Check if a trailer has a date conflict with existing rentals
  hasDateConflict(trailerId: string, startDate: string, endDate: string, excludeRentalId?: string): boolean {
    const newStart = new Date(startDate).getTime();
    const newEnd = new Date(endDate).getTime();
    return rentals.some(r => {
      if (r.trailerId !== trailerId) return false;
      if (r.status === 'cancelled' || r.status === 'completed') return false;
      if (excludeRentalId && r.id === excludeRentalId) return false;
      const existingStart = new Date(r.startDate).getTime();
      const existingEnd = new Date(r.endDate).getTime();
      // Overlap check
      return newStart <= existingEnd && newEnd >= existingStart;
    });
  },

  // Get booked periods for a trailer (for UI display)
  getTrailerBookings(trailerId: string) {
    return rentals.filter(r =>
      r.trailerId === trailerId &&
      (r.status === 'active' || r.status === 'scheduled')
    ).map(r => ({
      id: r.id,
      start: r.startDate,
      end: r.endDate,
      clientName: clients.find(c => c.id === r.clientId)?.name || 'Desconhecido',
      status: r.status,
    }));
  },

  // Add rental — now allows any trailer (not just available), validates conflicts
  addRental(data: Omit<Rental, 'id' | 'createdAt'>) {
    if (this.hasDateConflict(data.trailerId, data.startDate, data.endDate)) {
      return null;
    }
    const rental: Rental = {
      ...data,
      id: 'r' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    rentals = [rental, ...rentals];
    const today = new Date().toISOString().split('T')[0];
    if (data.startDate <= today) {
      trailers = trailers.map(t =>
        t.id === data.trailerId ? { ...t, status: 'rented' as const } : t
      );
    }
    notify();
    return rental;
  },

  // Update an existing rental
  updateRental(rentalId: string, updates: Partial<Omit<Rental, 'id' | 'createdAt'>>) {
    const existing = rentals.find(r => r.id === rentalId);
    if (!existing) return false;

    const newTrailerId = updates.trailerId || existing.trailerId;
    const newStart = updates.startDate || existing.startDate;
    const newEnd = updates.endDate || existing.endDate;

    // Check conflict if dates or trailer changed
    if (newTrailerId !== existing.trailerId || newStart !== existing.startDate || newEnd !== existing.endDate) {
      if (this.hasDateConflict(newTrailerId, newStart, newEnd, rentalId)) {
        return false;
      }
    }

    // If trailer changed, free old trailer
    if (updates.trailerId && updates.trailerId !== existing.trailerId) {
      const hasOtherOnOld = rentals.some(r =>
        r.id !== rentalId && r.trailerId === existing.trailerId && (r.status === 'active' || r.status === 'scheduled')
      );
      if (!hasOtherOnOld) {
        trailers = trailers.map(t =>
          t.id === existing.trailerId ? { ...t, status: 'available' as const } : t
        );
      }
      const today = new Date().toISOString().split('T')[0];
      if (newStart <= today && (updates.status || existing.status) === 'active') {
        trailers = trailers.map(t =>
          t.id === updates.trailerId ? { ...t, status: 'rented' as const } : t
        );
      }
    }

    rentals = rentals.map(r =>
      r.id === rentalId ? { ...r, ...updates } : r
    );
    notify();
    return true;
  },

  completeRental(rentalId: string, actualKm?: number) {
    const rental = rentals.find(r => r.id === rentalId);
    if (!rental) return;
    const km = actualKm ?? rental.estimatedKm;
    rentals = rentals.map(r =>
      r.id === rentalId ? { ...r, status: 'completed' as const } : r
    );
    // Add km to trailer and check if it has another active rental
    const hasOtherActive = rentals.some(r =>
      r.id !== rentalId && r.trailerId === rental.trailerId && r.status === 'active'
    );
    trailers = trailers.map(t =>
      t.id === rental.trailerId
        ? { ...t, status: hasOtherActive ? 'rented' as const : 'available' as const, totalKm: t.totalKm + km }
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
    const hasOtherActive = rentals.some(r =>
      r.id !== rentalId && r.trailerId === rental.trailerId && r.status === 'active'
    );
    if (!hasOtherActive) {
      trailers = trailers.map(t =>
        t.id === rental.trailerId ? { ...t, status: 'available' as const } : t
      );
    }
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

  addTrailer(data: Omit<TrailerUnit, 'id' | 'totalKm' | 'lastMaintenanceKm' | 'nextMaintenanceKm'>) {
    const trailer: TrailerUnit = {
      ...data,
      id: 't' + Date.now(),
      totalKm: 0,
      lastMaintenanceKm: 0,
      nextMaintenanceKm: data.maintenanceIntervalKm || 5000,
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

  // Permissions management
  setEmployeePermissions(pages: PermissionPage[]) {
    employeePermissions = new Set(pages);
    notify();
  },

  hasPermission(page: PermissionPage, role: 'admin' | 'employee'): boolean {
    if (role === 'admin') return true;
    return employeePermissions.has(page);
  },

  // Employee management
  addEmployee(data: Omit<Employee, 'id' | 'createdAt' | 'lastActiveAt' | 'totalRentalsCreated' | 'totalClientsCreated' | 'totalMaintenanceCreated'>) {
    const employee: Employee = {
      ...data,
      id: 'emp' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
      lastActiveAt: new Date().toISOString(),
      totalRentalsCreated: 0,
      totalClientsCreated: 0,
      totalMaintenanceCreated: 0,
    };
    employees = [employee, ...employees];
    notify();
    return employee;
  },

  updateEmployee(employeeId: string, updates: Partial<Employee>) {
    employees = employees.map(e =>
      e.id === employeeId ? { ...e, ...updates } : e
    );
    notify();
  },

  toggleEmployeeStatus(employeeId: string) {
    employees = employees.map(e =>
      e.id === employeeId ? { ...e, status: e.status === 'active' ? 'inactive' as const : 'active' as const } : e
    );
    notify();
  },

  removeEmployee(employeeId: string) {
    employees = employees.filter(e => e.id !== employeeId);
    notify();
  },

  // Notifications
  getNotifications() {
    const today = new Date();
    const notifications: { id: string; type: 'warning' | 'info' | 'danger'; title: string; message: string; date: string }[] = [];

    rentals.filter(r => r.status === 'active').forEach(r => {
      const end = new Date(r.endDate);
      const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const client = clients.find(c => c.id === r.clientId);
      const trailer = trailers.find(t => t.id === r.trailerId);

      if (diffDays < 0) {
        notifications.push({
          id: 'n-overdue-' + r.id, type: 'danger', title: 'Aluguel Vencido!',
          message: `${client?.name} - ${trailer?.plate} venceu há ${Math.abs(diffDays)} dia(s)`, date: r.endDate,
        });
      } else if (diffDays <= 2) {
        notifications.push({
          id: 'n-expiring-' + r.id, type: 'warning', title: 'Aluguel Vencendo',
          message: `${client?.name} - ${trailer?.plate} vence em ${diffDays} dia(s)`, date: r.endDate,
        });
      }
    });

    // Upcoming rentals (scheduled for next 2 days)
    rentals.filter(r => r.status === 'active').forEach(r => {
      const start = new Date(r.startDate);
      const diffDays = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const client = clients.find(c => c.id === r.clientId);

      if (diffDays >= 0 && diffDays <= 1) {
        notifications.push({
          id: 'n-arriving-' + r.id, type: 'info', title: 'Cliente Chegando',
          message: `${client?.name} ${diffDays === 0 ? 'chega hoje' : 'chega amanhã'}`, date: r.startDate,
        });
      }
    });

    trailers.forEach(t => {
      const progress = ((t.totalKm - t.lastMaintenanceKm) / (t.nextMaintenanceKm - t.lastMaintenanceKm)) * 100;
      if (progress >= 80) {
        notifications.push({
          id: 'n-maint-' + t.id, type: progress >= 95 ? 'danger' : 'warning', title: 'Manutenção Próxima',
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

  // Sales management
  addSale(data: Omit<Sale, 'id' | 'createdAt'>) {
    const sale: Sale = {
      ...data,
      id: 's' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    sales = [sale, ...sales];
    notify();
    return sale;
  },

  removeSale(saleId: string) {
    sales = sales.filter(s => s.id !== saleId);
    notify();
  },
};
