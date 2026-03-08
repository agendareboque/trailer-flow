import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { isAfter, startOfDay } from 'date-fns';
import { toast } from 'sonner';

interface Aluguel {
  id: string;
  cliente_id: string | null;
  reboque_id: string | null;
  data_retirada: string | null;
  data_devolucao: string | null;
  valor: number | null;
  status: string | null;
  created_at: string | null;
  cliente_nome?: string;
  reboque_nome?: string;
  reboque_placa?: string;
}

export default function RentalsPage() {
  const { empresaId } = useAuth();
  const [rentals, setRentals] = useState<Aluguel[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchRentals = async () => {
    if (!empresaId) return;

    const { data, error } = await supabase
      .from('alugueis')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar aluguéis');
      console.error(error);
      setLoading(false);
      return;
    }

    const rows = data || [];
    const clienteIds = [...new Set(rows.map(r => r.cliente_id).filter(Boolean))] as string[];
    const reboqueIds = [...new Set(rows.map(r => r.reboque_id).filter(Boolean))] as string[];

    const [clientesRes, reboquesRes] = await Promise.all([
      clienteIds.length > 0
        ? supabase.from('clientes').select('id, nome').in('id', clienteIds)
        : Promise.resolve({ data: [] }),
      reboqueIds.length > 0
        ? supabase.from('reboques').select('id, nome, placa').in('id', reboqueIds)
        : Promise.resolve({ data: [] }),
    ]);

    const clienteMap = Object.fromEntries((clientesRes.data || []).map(c => [c.id, c.nome]));
    const reboqueMap = Object.fromEntries((reboquesRes.data || []).map(r => [r.id, r]));

    const mapped = rows.map(r => ({
      ...r,
      cliente_nome: (r.cliente_id && clienteMap[r.cliente_id]) || 'Desconhecido',
      reboque_nome: (r.reboque_id && reboqueMap[r.reboque_id]?.nome) || 'Desconhecido',
      reboque_placa: (r.reboque_id && reboqueMap[r.reboque_id]?.placa) || '—',
    }));

    setRentals(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchRentals();
    const handler = () => fetchRentals();
    window.addEventListener('rentals-updated', handler);
    return () => window.removeEventListener('rentals-updated', handler);
  }, []);

  const isOverdue = (rental: Aluguel) => {
    if (!rental.data_devolucao) return false;
    if (rental.status === 'finalizado' || rental.status === 'cancelado') return false;
    return isAfter(startOfDay(new Date()), new Date(rental.data_devolucao));
  };

  const getDisplayStatus = (rental: Aluguel) => {
    if (isOverdue(rental)) return 'atrasado';
    return rental.status || 'reservado';
  };

  const filtered = rentals.filter(r => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'atrasado') return isOverdue(r);
    return r.status === filterStatus;
  });

  const handleCancel = async (id: string) => {
    const rental = rentals.find(r => r.id === id);
    const { error } = await supabase.from('alugueis').update({ status: 'cancelado' }).eq('id', id);
    if (error) {
      toast.error('Erro ao cancelar');
    } else {
      if (rental?.reboque_id) {
        await supabase.from('reboques').update({ status: 'disponivel' }).eq('id', rental.reboque_id);
      }
      toast.success('Aluguel cancelado');
      fetchRentals();
    }
  };

  const handleFinalize = async (id: string) => {
    const rental = rentals.find(r => r.id === id);
    const { error } = await supabase.from('alugueis').update({ status: 'finalizado' }).eq('id', id);
    if (error) {
      toast.error('Erro ao finalizar');
    } else {
      if (rental?.reboque_id) {
        await supabase.from('reboques').update({ status: 'disponivel' }).eq('id', rental.reboque_id);
      }
      toast.success('Aluguel finalizado');
      fetchRentals();
    }
  };

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Aluguéis</h1>
        <p className="page-subtitle">Gerencie locações e agendamentos</p>
      </div>

      <div className="mb-6">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="reservado">Reservados</SelectItem>
            <SelectItem value="em_uso">Em Uso</SelectItem>
            <SelectItem value="finalizado">Finalizados</SelectItem>
            <SelectItem value="atrasado">Atrasados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((rental, i) => (
            <motion.div key={rental.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className={`rounded-xl border p-5 hover:shadow-md transition-shadow ${isOverdue(rental) ? 'bg-destructive/5 border-destructive/30' : 'bg-card'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold font-heading">{rental.cliente_nome}</h3>
                  <p className="text-sm text-muted-foreground">
                    {rental.reboque_nome} • {rental.reboque_placa}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="text-right">
                    <p className="text-muted-foreground">
                      {rental.data_retirada ? format(new Date(rental.data_retirada), "dd MMM", { locale: ptBR }) : '—'} — {rental.data_devolucao ? format(new Date(rental.data_devolucao), "dd MMM", { locale: ptBR }) : '—'}
                    </p>
                    <p className="font-semibold font-heading text-lg">
                      R$ {(rental.valor || 0).toFixed(2)}
                    </p>
                  </div>
                  <StatusBadge status={rental.status || 'reservado'} />
                  {(rental.status === 'reservado' || rental.status === 'em_uso') && (
                    <div className="flex gap-1">
                      {rental.status === 'em_uso' && (
                        <Button size="sm" variant="ghost" className="text-success hover:text-success" onClick={() => handleFinalize(rental.id)} title="Finalizar Aluguel">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleCancel(rental.id)} title="Cancelar">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">Nenhum aluguel encontrado.</div>
      )}
    </AppLayout>
  );
}
