import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { mockRentals, getClientById, getTrailerById, getModelById } from '@/lib/mock-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RentalsPage() {
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = mockRentals.filter(r =>
    filterStatus === 'all' || r.status === filterStatus
  );

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
          const client = getClientById(rental.clientId);
          const trailer = getTrailerById(rental.trailerId);
          const model = trailer ? getModelById(trailer.modelId) : null;

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
                      {model?.name} • {trailer?.plate}
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
