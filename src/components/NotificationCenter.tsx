import { useState } from 'react';
import { Bell, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useStore } from '@/hooks/use-store';
import { motion, AnimatePresence } from 'framer-motion';

const typeConfig = {
  danger: { icon: AlertCircle, className: 'text-destructive bg-destructive/10' },
  warning: { icon: AlertTriangle, className: 'text-warning bg-warning/10' },
  info: { icon: Info, className: 'text-primary bg-primary/10' },
};

export function NotificationCenter() {
  const { notifications } = useStore();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = notifications.filter(n => !dismissed.has(n.id));
  const dangerCount = visible.filter(n => n.type === 'danger').length;
  const totalCount = visible.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {totalCount > 0 && (
            <span className={`absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
              dangerCount > 0 ? 'bg-destructive text-destructive-foreground' : 'bg-warning text-warning-foreground'
            }`}>
              {totalCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 max-h-96 overflow-hidden">
        <div className="p-3 border-b bg-card">
          <h3 className="font-heading font-semibold text-sm">Notificações</h3>
          <p className="text-xs text-muted-foreground">{totalCount} alerta(s) ativo(s)</p>
        </div>
        <div className="overflow-y-auto max-h-72 scrollbar-thin">
          <AnimatePresence>
            {visible.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Nenhuma notificação 🎉
              </div>
            ) : (
              visible.map((n) => {
                const config = typeConfig[n.type];
                const Icon = config.icon;
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-b last:border-b-0"
                  >
                    <div className="p-3 flex items-start gap-3 hover:bg-muted/50 transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.className}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                      </div>
                      <button
                        onClick={() => setDismissed(prev => new Set(prev).add(n.id))}
                        className="text-muted-foreground hover:text-foreground flex-shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </PopoverContent>
    </Popover>
  );
}
