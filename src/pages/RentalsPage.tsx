import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { useStore } from '@/hooks/use-store';
import { store } from '@/lib/store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function RentalsPage() {
  const { rentals, clients, trailers, models } = useStore();
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = rentals.filter(r =>
    filterStatus === 'all' || r.status === filterStatus
  );

  const handleComplete = (rentalId: string) => {
    store.completeRental(rentalId);
    toast({ title: 'Aluguel concluído!', description: 'Km adicionados ao reboque automaticamente.' });
  };

  const handleCancel = (rentalId: string) => {
    store.cancelRental(rentalId);
    toast({ title: 'Aluguel cancelado' });
  };

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Aluguéis</h1>
        <p className="page-subtitle">Gerencie locações de reboques</p>
      </div>

      <div className="mb-6">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="completed">Concluídos</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((rental, i) => {
          const client = clients.find(c => c.id === rental.clientId);
          const trailer = trailers.find(t => t.id === rental.trailerId);
          const model = trailer ? models.find(m => m.id === trailer.modelId) : null;

          return (
            <motion.div
              key={rental.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-xl border p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: trailer?.color + '20', color: trailer?.color }}
                  >
                    {trailer?.plate.slice(0, 3)}
                  </div>
                  <div>
                    <h3 className="font-semibold font-heading">{client?.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {model?.name} • {trailer?.plate} • {rental.estimatedKm.toLocaleString()} km est.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="text-right">
                    <p className="text-muted-foreground">
                      {format(new Date(rental.startDate), "dd MMM", { locale: ptBR })} — {format(new Date(rental.endDate), "dd MMM", { locale: ptBR })}
                    </p>
                    <p className="font-semibold font-heading text-lg">
                      R$ {rental.totalPrice.toFixed(2)}
                    </p>
                  </div>
                  <StatusBadge status={rental.status} />
                  {rental.status === 'active' && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="text-success hover:text-success" onClick={() => handleComplete(rental.id)} title="Concluir">
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleCancel(rental.id)} title="Cancelar">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum aluguel encontrado.
        </div>
      )}
    </AppLayout>
  );
}
