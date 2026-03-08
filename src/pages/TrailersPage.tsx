import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

interface Reboque {
  id: string;
  nome: string | null;
  placa: string | null;
  tipo: string | null;
  valor_diaria: number | null;
  status: string | null;
  created_at: string | null;
}

export default function TrailersPage() {
  const { empresaId } = useAuth();
  const [trailers, setTrailers] = useState<Reboque[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchTrailers = async () => {
    const { data, error } = await supabase
      .from('reboques')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar reboques');
      console.error(error);
    } else {
      setTrailers((data as Reboque[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTrailers();
    const handler = () => fetchTrailers();
    window.addEventListener('trailers-updated', handler);
    return () => window.removeEventListener('trailers-updated', handler);
  }, []);

  const filtered = trailers.filter(t => {
    const matchSearch =
      (t.placa || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.nome || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getStatusForBadge = (status: string | null) => {
    switch (status) {
      case 'disponivel': return 'available';
      case 'alugado': return 'rented';
      case 'manutencao': return 'maintenance';
      default: return status || 'available';
    }
  };

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
            <SelectItem value="disponivel">Disponível</SelectItem>
            <SelectItem value="alugado">Alugado</SelectItem>
            <SelectItem value="manutencao">Manutenção</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Nenhum reboque encontrado.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((trailer, i) => (
            <motion.div key={trailer.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-xl border overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-3 bg-primary" />
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold font-heading truncate">{trailer.nome || 'Sem nome'}</h3>
                    <p className="text-sm text-muted-foreground">{trailer.placa || '—'}</p>
                  </div>
                  <StatusBadge status={getStatusForBadge(trailer.status)} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tipo</span>
                    <span className="font-medium">{trailer.tipo || '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Diária</span>
                    <span className="font-medium">R$ {(trailer.valor_diaria || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
