import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useStore } from '@/hooks/use-store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, ArrowDownCircle, ArrowUpCircle, TrendingUp, TrendingDown, DollarSign, Trash2 } from 'lucide-react';
import { getPaymentLabel } from '@/lib/mock-data';
import { NewSaleDialog } from '@/components/dialogs/NewSaleDialog';
import { store } from '@/lib/store';
import { toast } from '@/hooks/use-toast';

export default function SalesPage() {
  const { sales } = useStore();
  const [filterType, setFilterType] = useState('all');
  const [showNewDialog, setShowNewDialog] = useState(false);

  const filtered = sales.filter(s =>
    filterType === 'all' || s.type === filterType
  );

  const totals = useMemo(() => {
    const purchases = sales.filter(s => s.type === 'purchase').reduce((sum, s) => sum + s.price, 0);
    const salesTotal = sales.filter(s => s.type === 'sale').reduce((sum, s) => sum + s.price, 0);
    return { purchases, sales: salesTotal, balance: salesTotal - purchases };
  }, [sales]);

  const handleDelete = (id: string) => {
    store.removeSale(id);
    toast({ title: 'Registro removido' });
  };

  return (
    <AppLayout>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Compra & Venda</h1>
            <p className="page-subtitle">Controle de compras e vendas de reboques</p>
          </div>
          <Button onClick={() => setShowNewDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Transação
          </Button>
        </div>
      </div>

      {/* Financial summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Compras</p>
              <p className="text-xl font-bold font-heading">R$ {totals.purchases.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-xl border p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Vendas</p>
              <p className="text-xl font-bold font-heading">R$ {totals.sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Balanço</p>
              <p className={`text-xl font-bold font-heading ${totals.balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                R$ {totals.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="purchase">Compras</SelectItem>
            <SelectItem value="sale">Vendas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((sale, i) => (
          <motion.div
            key={sale.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl border p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  sale.type === 'purchase' ? 'bg-destructive/10' : 'bg-success/10'
                }`}>
                  {sale.type === 'purchase'
                    ? <ArrowDownCircle className="h-5 w-5 text-destructive" />
                    : <ArrowUpCircle className="h-5 w-5 text-success" />
                  }
                </div>
                <div>
                  <h3 className="font-semibold font-heading">{sale.trailerName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {sale.trailerPlate} • {sale.type === 'purchase' ? 'Vendedor' : 'Comprador'}: {sale.buyerOrSeller}
                  </p>
                  {sale.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5">{sale.notes}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="text-right">
                  <p className="text-muted-foreground">
                    {format(new Date(sale.date), "dd MMM yyyy", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-muted-foreground">{getPaymentLabel(sale.paymentMethod)}</p>
                  <p className={`font-semibold font-heading text-lg ${
                    sale.type === 'purchase' ? 'text-destructive' : 'text-success'
                  }`}>
                    {sale.type === 'purchase' ? '-' : '+'}R$ {sale.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  sale.type === 'purchase'
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-success/10 text-success'
                }`}>
                  {sale.type === 'purchase' ? 'Compra' : 'Venda'}
                </span>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(sale.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma transação encontrada.
        </div>
      )}

      <NewSaleDialog open={showNewDialog} onOpenChange={setShowNewDialog} />
    </AppLayout>
  );
}
