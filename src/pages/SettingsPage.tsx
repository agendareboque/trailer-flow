import { AppLayout } from '@/components/AppLayout';
import { useStore } from '@/hooks/use-store';
import { store, ALL_PAGES, type PermissionPage } from '@/lib/store';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { employeePermissions } = useStore();

  const togglePermission = (page: PermissionPage) => {
    const current = Array.from(employeePermissions);
    const updated = current.includes(page)
      ? current.filter(p => p !== page)
      : [...current, page];
    store.setEmployeePermissions(updated);
    toast({ title: 'Permissões atualizadas' });
  };

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Configurações</h1>
        <p className="page-subtitle">Gerencie permissões e configurações do sistema</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border p-6 max-w-lg"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-heading font-semibold">Permissões do Funcionário</h2>
            <p className="text-sm text-muted-foreground">
              Selecione as páginas que o funcionário pode acessar
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {ALL_PAGES.map(page => (
            <div key={page.id} className="flex items-center gap-3">
              <Checkbox
                id={page.id}
                checked={employeePermissions.has(page.id)}
                onCheckedChange={() => togglePermission(page.id)}
              />
              <Label htmlFor={page.id} className="cursor-pointer">{page.label}</Label>
            </div>
          ))}
        </div>

        <div className="mt-6 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
          <p>💡 O Dashboard é sempre visível para todos os usuários.</p>
          <p>Administradores sempre têm acesso total.</p>
        </div>
      </motion.div>
    </AppLayout>
  );
}
