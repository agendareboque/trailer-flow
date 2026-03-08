import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Search, Phone, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Cliente {
  id: string;
  nome: string | null;
  telefone: string | null;
  created_at: string | null;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar clientes');
      console.error(error);
    } else {
      setClients(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filtered = clients.filter(c =>
    (c.nome || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.telefone || '').includes(search)
  );

  const client = selectedClient ? clients.find(c => c.id === selectedClient) : null;

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Clientes</h1>
        <p className="page-subtitle">Gerencie seus clientes</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou telefone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 max-w-md" />
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum cliente encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-xl border p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedClient(c.id)}>
              <h3 className="font-semibold font-heading">{c.nome || 'Sem nome'}</h3>
              <div className="space-y-1.5 text-sm text-muted-foreground mt-2">
                {c.telefone && (
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /><span>{c.telefone}</span></div>
                )}
                {c.created_at && (
                  <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /><span>Desde {new Date(c.created_at).toLocaleDateString('pt-BR')}</span></div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={!!client} onOpenChange={() => setSelectedClient(null)}>
        {client && (
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-heading">{client.nome || 'Sem nome'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Telefone</span><p className="font-medium">{client.telefone || '—'}</p></div>
                <div><span className="text-muted-foreground">Cadastrado em</span><p className="font-medium">{client.created_at ? new Date(client.created_at).toLocaleDateString('pt-BR') : '—'}</p></div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </AppLayout>
  );
}
