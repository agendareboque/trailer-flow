// Mock data for TrailerRent

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  status: 'active' | 'inactive';
  permissions: string[];
  lastActiveAt: string;
  createdAt: string;
  totalRentalsCreated: number;
  totalClientsCreated: number;
  totalMaintenanceCreated: number;
  notes?: string;
}

export interface TrailerModel {
  id: string;
  name: string;
  description: string;
  dailyRate: number;
}

export interface TrailerUnit {
  id: string;
  modelId: string;
  name: string;
  plate: string;
  color: string;
  status: 'available' | 'rented' | 'maintenance';
  imageUrl?: string;
  documentUrl?: string;
  notes?: string;
  dailyRate: number;
  totalKm: number;
  lastMaintenanceKm: number;
  nextMaintenanceKm: number;
  maintenanceIntervalKm: number;
}

export interface Client {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  score: number;
  totalRentals: number;
  lateReturns: number;
  notes: string;
}

export interface Rental {
  id: string;
  clientId: string;
  trailerId: string;
  startDate: string;
  endDate: string;
  estimatedKm: number;
  basePrice: number;
  discountType?: 'value' | 'percentage';
  discountAmount?: number;
  totalPrice: number;
  status: 'active' | 'completed' | 'cancelled' | 'scheduled';
  paymentMethod?: string;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: string;
  trailerId: string;
  date: string;
  description: string;
  cost: number;
  km: number;
}

export const mockEmployees: Employee[] = [
  {
    id: 'emp1', name: 'Maria Funcionária', email: 'maria@trailerrent.com', phone: '(11) 98888-0001',
    document: '111.222.333-44', status: 'active', permissions: ['trailers', 'clients', 'rentals', 'calendar', 'maintenance'],
    lastActiveAt: '2026-03-08T14:30:00', createdAt: '2025-06-15', totalRentalsCreated: 47, totalClientsCreated: 12, totalMaintenanceCreated: 8,
  },
  {
    id: 'emp2', name: 'João Atendente', email: 'joao.func@trailerrent.com', phone: '(11) 98888-0002',
    document: '555.666.777-88', status: 'active', permissions: ['trailers', 'rentals', 'calendar'],
    lastActiveAt: '2026-03-07T18:15:00', createdAt: '2025-09-01', totalRentalsCreated: 23, totalClientsCreated: 5, totalMaintenanceCreated: 2,
  },
  {
    id: 'emp3', name: 'Ana Oliveira', email: 'ana.func@trailerrent.com', phone: '(11) 98888-0003',
    document: '999.000.111-22', status: 'inactive', permissions: ['trailers', 'clients'],
    lastActiveAt: '2026-02-20T10:00:00', createdAt: '2025-11-10', totalRentalsCreated: 8, totalClientsCreated: 3, totalMaintenanceCreated: 0,
    notes: 'Afastada temporariamente',
  },
];

export const mockUsers: User[] = [
  { id: '1', name: 'Carlos Admin', email: 'admin@trailerrent.com', role: 'admin' },
  { id: '2', name: 'Maria Funcionária', email: 'maria@trailerrent.com', role: 'employee' },
];

export const mockModels: TrailerModel[] = [
  { id: 'm1', name: 'Carretinha Leve', description: 'Reboque leve para cargas até 500kg', dailyRate: 80 },
  { id: 'm2', name: 'Carretinha Média', description: 'Reboque médio para cargas até 1000kg', dailyRate: 120 },
  { id: 'm3', name: 'Reboque Pesado', description: 'Reboque para cargas até 2000kg', dailyRate: 200 },
  { id: 'm4', name: 'Reboque Fechado', description: 'Reboque fechado para mudanças', dailyRate: 250 },
];

const trailerColors = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d', '#4f46e5'];

export const mockTrailers: TrailerUnit[] = [
  { id: 't1', modelId: 'm1', name: 'Carretinha Leve #1', plate: 'ABC-1234', color: trailerColors[0], status: 'available', dailyRate: 80, totalKm: 12500, lastMaintenanceKm: 10000, nextMaintenanceKm: 15000, maintenanceIntervalKm: 5000, notes: 'Reboque em ótimo estado' },
  { id: 't2', modelId: 'm1', name: 'Carretinha Leve #2', plate: 'DEF-5678', color: trailerColors[1], status: 'rented', dailyRate: 80, totalKm: 8200, lastMaintenanceKm: 5000, nextMaintenanceKm: 10000, maintenanceIntervalKm: 5000 },
  { id: 't3', modelId: 'm2', name: 'Carretinha Média #1', plate: 'GHI-9012', color: trailerColors[2], status: 'available', dailyRate: 120, totalKm: 22000, lastMaintenanceKm: 20000, nextMaintenanceKm: 25000, maintenanceIntervalKm: 5000 },
  { id: 't4', modelId: 'm2', name: 'Carretinha Média #2', plate: 'JKL-3456', color: trailerColors[3], status: 'maintenance', dailyRate: 120, totalKm: 15800, lastMaintenanceKm: 15000, nextMaintenanceKm: 20000, maintenanceIntervalKm: 5000 },
  { id: 't5', modelId: 'm3', name: 'Reboque Pesado #1', plate: 'MNO-7890', color: trailerColors[4], status: 'rented', dailyRate: 200, totalKm: 31000, lastMaintenanceKm: 30000, nextMaintenanceKm: 35000, maintenanceIntervalKm: 5000 },
  { id: 't6', modelId: 'm3', name: 'Reboque Pesado #2', plate: 'PQR-1234', color: trailerColors[5], status: 'available', dailyRate: 200, totalKm: 5200, lastMaintenanceKm: 5000, nextMaintenanceKm: 10000, maintenanceIntervalKm: 5000 },
  { id: 't7', modelId: 'm4', name: 'Reboque Fechado #1', plate: 'STU-5678', color: trailerColors[6], status: 'available', dailyRate: 250, totalKm: 18700, lastMaintenanceKm: 15000, nextMaintenanceKm: 20000, maintenanceIntervalKm: 5000 },
  { id: 't8', modelId: 'm4', name: 'Reboque Fechado #2', plate: 'VWX-9012', color: trailerColors[7], status: 'rented', dailyRate: 250, totalKm: 9400, lastMaintenanceKm: 5000, nextMaintenanceKm: 10000, maintenanceIntervalKm: 5000 },
];

export const mockClients: Client[] = [
  { id: 'c1', name: 'João Silva', document: '123.456.789-00', email: 'joao@email.com', phone: '(11) 99999-0001', address: { street: 'Rua das Flores, 123', city: 'São Paulo', state: 'SP', zip: '01234-567' }, score: 92, totalRentals: 15, lateReturns: 0, notes: 'Cliente premium, sempre pontual' },
  { id: 'c2', name: 'Maria Santos', document: '987.654.321-00', email: 'maria@email.com', phone: '(11) 99999-0002', address: { street: 'Av. Paulista, 456', city: 'São Paulo', state: 'SP', zip: '01310-100' }, score: 78, totalRentals: 8, lateReturns: 1, notes: '' },
  { id: 'c3', name: 'Pedro Oliveira', document: '456.789.123-00', email: 'pedro@email.com', phone: '(21) 99999-0003', address: { street: 'Rua Copacabana, 789', city: 'Rio de Janeiro', state: 'RJ', zip: '22040-020' }, score: 65, totalRentals: 5, lateReturns: 2, notes: 'Atenção com devoluções' },
  { id: 'c4', name: 'Ana Costa', document: '12.345.678/0001-90', email: 'ana@empresa.com', phone: '(31) 99999-0004', address: { street: 'Av. Afonso Pena, 321', city: 'Belo Horizonte', state: 'MG', zip: '30130-001' }, score: 95, totalRentals: 22, lateReturns: 0, notes: 'Empresa parceira' },
  { id: 'c5', name: 'Lucas Ferreira', document: '321.654.987-00', email: 'lucas@email.com', phone: '(41) 99999-0005', address: { street: 'Rua XV de Novembro, 654', city: 'Curitiba', state: 'PR', zip: '80020-310' }, score: 45, totalRentals: 3, lateReturns: 2, notes: 'Histórico de atrasos' },
];

export const mockRentals: Rental[] = [
  { id: 'r1', clientId: 'c1', trailerId: 't2', startDate: '2026-03-01', endDate: '2026-03-10', estimatedKm: 500, basePrice: 800, totalPrice: 800, status: 'active', paymentMethod: 'pix', createdAt: '2026-02-28' },
  { id: 'r2', clientId: 'c4', trailerId: 't5', startDate: '2026-03-03', endDate: '2026-03-15', estimatedKm: 1200, basePrice: 2400, totalPrice: 2400, status: 'active', paymentMethod: 'credit_card', createdAt: '2026-03-02' },
  { id: 'r3', clientId: 'c2', trailerId: 't8', startDate: '2026-03-05', endDate: '2026-03-12', estimatedKm: 800, basePrice: 1750, totalPrice: 1750, status: 'active', paymentMethod: 'cash', createdAt: '2026-03-04' },
  { id: 'r4', clientId: 'c1', trailerId: 't1', startDate: '2026-02-10', endDate: '2026-02-20', estimatedKm: 600, basePrice: 800, totalPrice: 800, status: 'completed', paymentMethod: 'pix', createdAt: '2026-02-09' },
  { id: 'r5', clientId: 'c3', trailerId: 't3', startDate: '2026-02-15', endDate: '2026-02-25', estimatedKm: 900, basePrice: 1200, totalPrice: 1200, status: 'completed', paymentMethod: 'boleto', createdAt: '2026-02-14' },
  { id: 'r6', clientId: 'c5', trailerId: 't6', startDate: '2026-01-20', endDate: '2026-01-30', estimatedKm: 1000, basePrice: 2000, totalPrice: 2000, status: 'completed', paymentMethod: 'debit_card', createdAt: '2026-01-19' },
  { id: 'r7', clientId: 'c3', trailerId: 't7', startDate: '2026-02-01', endDate: '2026-02-05', estimatedKm: 200, basePrice: 1000, totalPrice: 1000, status: 'cancelled', createdAt: '2026-01-31' },
];

export const mockMaintenance: MaintenanceRecord[] = [
  { id: 'mt1', trailerId: 't1', date: '2026-01-15', description: 'Troca de pneus e alinhamento', cost: 450, km: 10000 },
  { id: 'mt2', trailerId: 't2', date: '2026-02-01', description: 'Revisão geral: freios e suspensão', cost: 780, km: 5000 },
  { id: 'mt3', trailerId: 't3', date: '2025-12-20', description: 'Troca de rolamentos', cost: 320, km: 20000 },
  { id: 'mt4', trailerId: 't4', date: '2026-03-05', description: 'Reparo na carroceria e pintura', cost: 1200, km: 15000 },
  { id: 'mt5', trailerId: 't5', date: '2026-01-10', description: 'Troca de óleo e filtros', cost: 250, km: 30000 },
];

export function getModelById(id: string) {
  return mockModels.find(m => m.id === id);
}

export function getClientById(id: string) {
  return mockClients.find(c => c.id === id);
}

export function getTrailerById(id: string) {
  return mockTrailers.find(t => t.id === id);
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-destructive';
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'available': return 'bg-success/10 text-success';
    case 'rented': return 'bg-primary/10 text-primary';
    case 'maintenance': return 'bg-warning/10 text-warning';
    case 'active': return 'bg-primary/10 text-primary';
    case 'completed': return 'bg-success/10 text-success';
    case 'cancelled': return 'bg-destructive/10 text-destructive';
    case 'scheduled': return 'bg-accent text-accent-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    available: 'Disponível',
    rented: 'Alugado',
    maintenance: 'Manutenção',
    active: 'Ativo',
    completed: 'Concluído',
    cancelled: 'Cancelado',
    scheduled: 'Agendado',
  };
  return labels[status] || status;
}

export function getPaymentLabel(method?: string): string {
  const labels: Record<string, string> = {
    pix: 'PIX',
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    cash: 'Dinheiro',
    boleto: 'Boleto',
  };
  return method ? labels[method] || method : '';
}
