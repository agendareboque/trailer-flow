import { Truck, CheckCircle, AlertTriangle, Wrench, FileText, Users } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { AppLayout } from '@/components/AppLayout';
import { mockTrailers, mockClients, mockRentals } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const navigate = useNavigate();

  const available = mockTrailers.filter(t => t.status === 'available').length;
  const rented = mockTrailers.filter(t => t.status === 'rented').length;
  const maintenance = mockTrailers.filter(t => t.status === 'maintenance').length;
  const activeRentals = mockRentals.filter(r => r.status === 'active').length;

  const quickActions = [
    { label: 'Novo Aluguel', icon: FileText, onClick: () => navigate('/rentals') },
    { label: 'Ver Reboques', icon: Truck, onClick: () => navigate('/trailers') },
    { label: 'Clientes', icon: Users, onClick: () => navigate('/clients') },
    { label: 'Calendário', icon: FileText, onClick: () => navigate('/calendar') },
  ];

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Visão geral do seu negócio</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard title="Total Reboques" value={mockTrailers.length} icon={Truck} color="primary" />
        <StatCard title="Disponíveis" value={available} icon={CheckCircle} color="success" />
        <StatCard title="Alugados" value={rented} icon={FileText} color="primary" />
        <StatCard title="Manutenção" value={maintenance} icon={Wrench} color="warning" />
        <StatCard title="Locações Ativas" value={activeRentals} icon={AlertTriangle} color="primary" />
        <StatCard title="Total Clientes" value={mockClients.length} icon={Users} color="success" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold font-heading mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={action.onClick}
            >
              <action.icon className="h-5 w-5" />
              <span className="text-sm">{action.label}</span>
            </Button>
          ))}
        </div>
      </motion.div>
    </AppLayout>
  );
}
