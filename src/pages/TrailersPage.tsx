import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { useStore } from '@/hooks/use-store';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { Search, Truck, StickyNote } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function TrailersPage() {
  const { trailers } = useStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = trailers.filter(t => {
    const matchSearch =
      t.plate.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Reboques</h1>
        <p className="page-subtitle">Gerencie sua frota de reboques</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por placa ou nome..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="available">Disponível</SelectItem>
            <SelectItem value="rented">Alugado</SelectItem>
            <SelectItem value="maintenance">Manutenção</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((trailer, i) => {
          const kmProgress = trailer.nextMaintenanceKm > trailer.lastMaintenanceKm
            ? ((trailer.totalKm - trailer.lastMaintenanceKm) / (trailer.nextMaintenanceKm - trailer.lastMaintenanceKm)) * 100
            : 0;
          return (
            <motion.div key={trailer.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-xl border overflow-hidden hover:shadow-md transition-shadow">
              {trailer.imageUrl ? (
                <img src={trailer.imageUrl} alt={trailer.name} className="w-full h-36 object-cover" />
              ) : (
                <div className="h-3" style={{ backgroundColor: trailer.color }} />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold font-heading truncate">{trailer.name}</h3>
                    <p className="text-sm text-muted-foreground">{trailer.plate}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {trailer.notes && (
                      <Tooltip>
                        <TooltipTrigger>
                          <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent><p className="max-w-52">{trailer.notes}</p></TooltipContent>
                      </Tooltip>
                    )}
                    <StatusBadge status={trailer.status} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Diária</span>
                    <span className="font-medium">R$ {trailer.dailyRate.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Km Total</span>
                    <span className="font-medium">{trailer.totalKm.toLocaleString()} km</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Preventiva</span>
                    <span className="font-medium">a cada {trailer.maintenanceIntervalKm.toLocaleString()} km</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Próx. Manutenção</span>
                      <span>{Math.round(Math.min(kmProgress, 100))}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${kmProgress > 80 ? 'bg-destructive' : kmProgress > 60 ? 'bg-warning' : 'bg-success'}`} style={{ width: `${Math.min(kmProgress, 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">Nenhum reboque encontrado com os filtros selecionados.</div>
      )}
    </AppLayout>
  );
}
