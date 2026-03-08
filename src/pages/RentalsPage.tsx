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
import { CheckCircle, XCircle } from 'lucide-react';
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

  const filtered = rentals.filter(r =>
    filterStatus === 'all' || r.status === filterStatus
  );

  const handleCancel = async (id: string) => {
    const { error } = await supabase.from('alugueis').update({ status: 'cancelado' }).eq('id', id);
    if (error) {
      toast.error('Erro ao cancelar');
    } else {
      toast.success('Aluguel cancelado');
      fetchRentals();
    }
  };

  const handleComplete = async (id: string) => {
    const rental = rentals.find(r => r.id === id);
    const { error } = await supabase.from('alugueis').update({ status: 'concluido' }).eq('id', id);
    if (error) {
      toast.error('Erro ao concluir');
    } else {
      // Set trailer back to disponivel
      if (rental?.reboque_id) {
        await supabase.from('reboques').update({ status: 'disponivel' }).eq('id', rental.reboque_id);
      }
      toast.success('Aluguel concluído');
      fetchRentals();
    }
  };

  const getStatusForBadge = (status: string | null) => {
    switch (status) {
      case 'ativo': return 'active';
      case 'concluido': return 'completed';
      case 'cancelado': return 'cancelled';
      case 'agendado': return 'scheduled';
      default: return status || 'active';
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
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="agendado">Agendados</SelectItem>
            <SelectItem value="concluido">Concluídos</SelectItem>
            <SelectItem value="cancelado">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((rental, i) => (
            <motion.div key={rental.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-xl border p-5 hover:shadow-md transition-shadow">
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
                  <StatusBadge status={getStatusForBadge(rental.status)} />
                  {rental.status === 'ativo' && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="text-success hover:text-success" onClick={() => handleComplete(rental.id)} title="Dar Baixa">
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
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">Nenhum aluguel encontrado.</div>
      )}
    </AppLayout>
  );
}
