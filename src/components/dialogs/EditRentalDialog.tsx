import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { differenceInDays, format } from 'date-fns';
import { AlertTriangle, Percent, DollarSign } from 'lucide-react';

interface RentalData {
  id: string;
  cliente_id: string | null;
  reboque_id: string | null;
  data_retirada: string | null;
  data_devolucao: string | null;
  valor: number | null;
  status: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rental: RentalData;
}

interface ClientOption { id: string; nome: string | null }
interface TrailerOption { id: string; nome: string | null; placa: string | null; valor_diaria: number | null }

export function EditRentalDialog({ open, onOpenChange, rental }: Props) {
  const { empresaId } = useAuth();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [trailers, setTrailers] = useState<TrailerOption[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [reboqueId, setReboqueId] = useState('');
  const [dataRetirada, setDataRetirada] = useState('');
  const [dataDevolucao, setDataDevolucao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [descontoTipo, setDescontoTipo] = useState<'none' | 'value' | 'percentage'>('none');
  const [descontoValor, setDescontoValor] = useState('');
  const [loading, setLoading] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [conflictDetails, setConflictDetails] = useState<{ cliente_nome: string; data_retirada: string; data_devolucao: string }[]>([]);
  const [checkingConflict, setCheckingConflict] = useState(false);

  useEffect(() => {
    if (open && empresaId) {
      supabase.from('clientes').select('id, nome').eq('empresa_id', empresaId).then(({ data }) => setClients(data || []));
      supabase.from('reboques').select('id, nome, placa, valor_diaria').eq('empresa_id', empresaId).then(({ data }) => setTrailers(data || []));

      // Pre-fill from rental
      setClienteId(rental.cliente_id || '');
      setReboqueId(rental.reboque_id || '');
      setDataRetirada(rental.data_retirada ? rental.data_retirada.split('T')[0] : '');
      setDataDevolucao(rental.data_devolucao ? rental.data_devolucao.split('T')[0] : '');
      setObservacoes('');
      setDescontoTipo('none');
      setDescontoValor('');
      setConflict(false);
      setConflictDetails([]);
    }
  }, [open, empresaId, rental]);

  const selectedTrailer = trailers.find(t => t.id === reboqueId);
  const dailyRate = selectedTrailer?.valor_diaria || 0;

  const dateError = useMemo(() => {
    if (!dataRetirada || !dataDevolucao) return '';
    if (new Date(dataDevolucao) < new Date(dataRetirada)) {
      return 'A data de devolução não pode ser anterior à data de retirada.';
    }
    return '';
  }, [dataRetirada, dataDevolucao]);

  const days = useMemo(() => {
    if (!dataRetirada || !dataDevolucao || dateError) return 0;
    return Math.max(differenceInDays(new Date(dataDevolucao), new Date(dataRetirada)), 1);
  }, [dataRetirada, dataDevolucao, dateError]);

  const basePrice = dailyRate * days;

  const discountValue = useMemo(() => {
    if (descontoTipo === 'none' || !descontoValor) return 0;
    const amt = Number(descontoValor);
    if (descontoTipo === 'percentage') return basePrice * (amt / 100);
    return amt;
  }, [descontoTipo, descontoValor, basePrice]);

  const totalPrice = Math.max(basePrice - discountValue, 0);

  // Conflict check (exclude current rental)
  useEffect(() => {
    if (!reboqueId || !dataRetirada || !dataDevolucao || dateError) {
      setConflict(false);
      setConflictDetails([]);
      return;
    }
    let cancelled = false;
    setCheckingConflict(true);

    const check = async () => {
      try {
        const { data, error } = await supabase
          .from('alugueis')
          .select('id, data_retirada, data_devolucao, cliente_id')
          .eq('reboque_id', reboqueId)
          .in('status', ['reservado', 'em_uso'])
          .neq('id', rental.id)
          .lte('data_retirada', dataDevolucao)
          .gte('data_devolucao', dataRetirada);

        if (cancelled) return;
        if (error) { setConflict(false); setConflictDetails([]); setCheckingConflict(false); return; }

        const items = data || [];
        if (items.length === 0) { setConflict(false); setConflictDetails([]); setCheckingConflict(false); return; }

        const clientIds = [...new Set(items.map(r => r.cliente_id).filter(Boolean))] as string[];
        let clientMap: Record<string, string> = {};
        if (clientIds.length > 0) {
          const { data: cd } = await supabase.from('clientes').select('id, nome').in('id', clientIds);
          if (!cancelled && cd) clientMap = Object.fromEntries(cd.map(c => [c.id, c.nome || 'Desconhecido']));
        }
        if (cancelled) return;

        setConflict(true);
        setConflictDetails(items.map(r => ({
          cliente_nome: (r.cliente_id && clientMap[r.cliente_id]) || 'Desconhecido',
          data_retirada: r.data_retirada || '',
          data_devolucao: r.data_devolucao || '',
        })));
      } catch { if (!cancelled) { setConflict(false); setConflictDetails([]); } }
      finally { if (!cancelled) setCheckingConflict(false); }
    };

    check();
    return () => { cancelled = true; };
  }, [reboqueId, dataRetirada, dataDevolucao, dateError, rental.id]);

  const handleSubmit = async () => {
    if (!clienteId || !reboqueId || !dataRetirada || !dataDevolucao) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (dateError) { toast.error(dateError); return; }
    if (conflict) { toast.error('Este reboque já está reservado para o período selecionado.'); return; }

    setLoading(true);

    const { error } = await supabase.from('alugueis').update({
      cliente_id: clienteId,
      reboque_id: reboqueId,
      data_retirada: dataRetirada,
      data_devolucao: dataDevolucao,
      valor: totalPrice,
    }).eq('id', rental.id);

    if (error) {
      toast.error('Erro ao atualizar aluguel');
      console.error(error);
      setLoading(false);
      return;
    }

    // If trailer changed, update old trailer to disponivel and new to alugado
    if (rental.reboque_id && rental.reboque_id !== reboqueId) {
      await supabase.from('reboques').update({ status: 'disponivel' }).eq('id', rental.reboque_id);
      await supabase.from('reboques').update({ status: 'alugado' }).eq('id', reboqueId);
    }

    setLoading(false);
    toast.success(`Aluguel atualizado! Total: R$ ${totalPrice.toFixed(2)}`);
    onOpenChange(false);
    window.dispatchEvent(new Event('rentals-updated'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Editar Aluguel</DialogTitle>
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
                  <SelectItem key={t.id} value={t.id}>
                    {t.placa} — {t.nome || 'Sem nome'} (R$ {(t.valor_diaria || 0).toFixed(2)}/dia)
                  </SelectItem>
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

          {dateError && <p className="text-sm text-destructive font-medium">{dateError}</p>}

          {conflict && conflictDetails.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-destructive text-sm font-semibold">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>Este reboque já está reservado para o período selecionado.</span>
              </div>
              {conflictDetails.map((c, idx) => (
                <div key={idx} className="text-sm text-muted-foreground pl-6">
                  <span className="font-medium text-foreground">{c.cliente_nome}</span>
                  {' — '}
                  {c.data_retirada ? format(new Date(c.data_retirada), "dd/MM/yyyy") : '?'}
                  {' até '}
                  {c.data_devolucao ? format(new Date(c.data_devolucao), "dd/MM/yyyy") : '?'}
                </div>
              ))}
            </div>
          )}

          {selectedTrailer && days > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-muted-foreground text-xs">Valor Diária</Label>
                <p className="font-semibold">R$ {dailyRate.toFixed(2)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Dias</Label>
                <p className="font-semibold">{days} dia(s)</p>
              </div>
            </div>
          )}

          <div>
            <Label>Desconto</Label>
            <div className="flex gap-2 mt-1">
              <Button type="button" size="sm" variant={descontoTipo === 'none' ? 'default' : 'outline'}
                onClick={() => { setDescontoTipo('none'); setDescontoValor(''); }}>Sem desconto</Button>
              <Button type="button" size="sm" variant={descontoTipo === 'value' ? 'default' : 'outline'}
                onClick={() => setDescontoTipo('value')}><DollarSign className="h-3 w-3 mr-1" />Valor</Button>
              <Button type="button" size="sm" variant={descontoTipo === 'percentage' ? 'default' : 'outline'}
                onClick={() => setDescontoTipo('percentage')}><Percent className="h-3 w-3 mr-1" />%</Button>
            </div>
            {descontoTipo !== 'none' && (
              <Input type="number" className="mt-2"
                placeholder={descontoTipo === 'percentage' ? 'Ex: 10' : 'Ex: 50.00'}
                value={descontoValor} onChange={e => setDescontoValor(e.target.value)} min="0" step="0.01" />
            )}
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Observações sobre a edição..." />
          </div>

          {basePrice > 0 && !conflict && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
              <p className="text-sm text-muted-foreground">{days} dia(s) × R$ {dailyRate.toFixed(2)}/dia</p>
              {discountValue > 0 && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Desconto: -R$ {discountValue.toFixed(2)}
                  {descontoTipo === 'percentage' && ` (${descontoValor}%)`}
                </p>
              )}
              <p className="text-2xl font-bold font-heading text-primary">R$ {totalPrice.toFixed(2)}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={loading || conflict || checkingConflict || !!dateError}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
