import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewRentalDialog({ open, onOpenChange }: Props) {
  const { empresaId } = useAuth();
  const [clients, setClients] = useState<{ id: string; nome: string | null }[]>([]);
  const [trailers, setTrailers] = useState<{ id: string; nome: string | null; placa: string | null }[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [reboqueId, setReboqueId] = useState('');
  const [dataRetirada, setDataRetirada] = useState('');
  const [dataDevolucao, setDataDevolucao] = useState('');
  const [valor, setValor] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      supabase.from('clientes').select('id, nome').then(({ data }) => setClients(data || []));
      supabase.from('reboques').select('id, nome, placa').then(({ data }) => setTrailers(data || []));
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!clienteId || !reboqueId || !dataRetirada || !dataDevolucao || !valor) {
      toast.error('Preencha todos os campos');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('alugueis').insert({
      cliente_id: clienteId,
      reboque_id: reboqueId,
      data_retirada: dataRetirada,
      data_devolucao: dataDevolucao,
      valor: Number(valor),
      status: 'ativo',
      empresa_id: empresaId,
    });
    setLoading(false);

    if (error) {
      toast.error('Erro ao registrar aluguel');
      console.error(error);
      return;
    }

    toast.success('Aluguel registrado!');
    setClienteId(''); setReboqueId(''); setDataRetirada(''); setDataDevolucao(''); setValor('');
    onOpenChange(false);
    window.dispatchEvent(new Event('rentals-updated'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Novo Aluguel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Cliente *</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
              <SelectContent>
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.nome || 'Sem nome'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Reboque *</Label>
            <Select value={reboqueId} onValueChange={setReboqueId}>
              <SelectTrigger><SelectValue placeholder="Selecione o reboque" /></SelectTrigger>
              <SelectContent>
                {trailers.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.placa} — {t.nome || 'Sem nome'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data Retirada *</Label>
              <Input type="date" value={dataRetirada} onChange={e => setDataRetirada(e.target.value)} />
            </div>
            <div>
              <Label>Data Devolução *</Label>
              <Input type="date" value={dataDevolucao} onChange={e => setDataDevolucao(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Valor Total (R$) *</Label>
            <Input type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="500.00" min="0" step="0.01" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Salvando...' : 'Registrar Aluguel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
