import { AppLayout } from '@/components/AppLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { useStore } from '@/hooks/use-store';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Wrench } from 'lucide-react';

export default function MaintenancePage() {
  const { trailers, models, maintenance } = useStore();

  const trailersWithMaint = trailers.map(t => ({
    ...t,
    model: models.find(m => m.id === t.modelId),
    records: maintenance.filter(m => m.trailerId === t.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    kmProgress: ((t.totalKm - t.lastMaintenanceKm) / (t.nextMaintenanceKm - t.lastMaintenanceKm)) * 100,
  }));

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Manutenção Preventiva</h1>
        <p className="page-subtitle">Acompanhe o histórico e a próxima manutenção</p>
      </div>

      <div className="space-y-4">
        {trailersWithMaint.map((trailer, i) => (
          <motion.div
            key={trailer.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl border overflow-hidden"
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-12 rounded-full" style={{ backgroundColor: trailer.color }} />
                  <div>
                    <h3 className="font-semibold font-heading">{trailer.plate}</h3>
                    <p className="text-sm text-muted-foreground">{trailer.model?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={trailer.status} />
                  {trailer.kmProgress > 80 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                      Manutenção Próxima
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Km Atual</span>
                  <p className="font-semibold">{trailer.totalKm.toLocaleString()} km</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Última Manutenção</span>
                  <p className="font-semibold">{trailer.lastMaintenanceKm.toLocaleString()} km</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Próxima Manutenção</span>
                  <p className="font-semibold">{trailer.nextMaintenanceKm.toLocaleString()} km</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progresso até próxima manutenção</span>
                  <span>{Math.round(trailer.kmProgress)}%</span>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      trailer.kmProgress > 80 ? 'bg-destructive' : trailer.kmProgress > 60 ? 'bg-warning' : 'bg-success'
                    }`}
                    style={{ width: `${Math.min(trailer.kmProgress, 100)}%` }}
                  />
                </div>
              </div>

              {trailer.records.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5" />
                    Histórico
                  </h4>
                  <div className="space-y-2">
                    {trailer.records.map(record => (
                      <div key={record.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{record.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(record.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} • {record.km.toLocaleString()} km
                          </p>
                        </div>
                        <span className="font-semibold text-destructive">
                          R$ {record.cost.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </AppLayout>
  );
}
