import { useState } from 'react';
import { Plus, FileText, Users, Truck, Wrench, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NewRentalDialog } from './dialogs/NewRentalDialog';
import { NewClientDialog } from './dialogs/NewClientDialog';
import { NewTrailerDialog } from './dialogs/NewTrailerDialog';
import { NewMaintenanceDialog } from './dialogs/NewMaintenanceDialog';

const actions = [
  { id: 'rental', label: 'Novo Aluguel', icon: FileText, color: 'bg-primary' },
  { id: 'client', label: 'Novo Cliente', icon: Users, color: 'bg-success' },
  { id: 'trailer', label: 'Novo Reboque', icon: Truck, color: 'bg-accent-foreground' },
  { id: 'maintenance', label: 'Manutenção', icon: Wrench, color: 'bg-warning' },
] as const;

type ActionId = typeof actions[number]['id'];

export function FloatingActionButton() {
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<ActionId | null>(null);

  const handleAction = (id: ActionId) => {
    setOpen(false);
    setDialog(id);
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB Menu */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3">
        {/* Main button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setOpen(o => !o)}
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow"
        >
          <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
            {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
          </motion.div>
        </motion.button>

        {/* Action items */}
        <AnimatePresence>
          {open && actions.map((action, i) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3"
            >
              <span className="bg-card text-card-foreground px-3 py-1.5 rounded-lg shadow-md text-sm font-medium whitespace-nowrap">
                {action.label}
              </span>
              <button
                onClick={() => handleAction(action.id)}
                className={`w-11 h-11 rounded-full ${action.color} text-primary-foreground shadow-md hover:shadow-lg flex items-center justify-center transition-shadow`}
              >
                <action.icon className="h-5 w-5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Dialogs */}
      <NewRentalDialog open={dialog === 'rental'} onOpenChange={(v) => !v && setDialog(null)} />
      <NewClientDialog open={dialog === 'client'} onOpenChange={(v) => !v && setDialog(null)} />
      <NewTrailerDialog open={dialog === 'trailer'} onOpenChange={(v) => !v && setDialog(null)} />
      <NewMaintenanceDialog open={dialog === 'maintenance'} onOpenChange={(v) => !v && setDialog(null)} />
    </>
  );
}
