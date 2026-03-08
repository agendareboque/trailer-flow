import { useState } from 'react';
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

export function NewTrailerDialog({ open, onOpenChange }: Props) {
  const { empresaId } = useAuth();
  const [nome, setNome] = useState('');
  const [placa, setPlaca] = useState('');
  const [tipo, setTipo] = useState('');
  const [valorDiaria, setValorDiaria] = useState('');
  const [status, setStatus] = useState('disponivel');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!nome || !placa || !valorDiaria) {
      toast.error('Preencha nome, placa e valor da diária');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('reboques').insert({
      nome,
      placa: placa.toUpperCase(),
      tipo: tipo || null,
      valor_diaria: Number(valorDiaria),
      status,
      empresa_id: empresaId,
    });
    setLoading(false);

    if (error) {
      toast.error('Erro ao cadastrar reboque');
      console.error(error);
      return;
    }

    toast.success('Reboque cadastrado!');
    setNome(''); setPlaca(''); setTipo(''); setValorDiaria(''); setStatus('disponivel');
    onOpenChange(false);
    window.dispatchEvent(new Event('trailers-updated'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Novo Reboque</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome do Reboque *</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Carretinha Leve 1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Placa *</Label>
              <Input value={placa} onChange={e => setPlaca(e.target.value)} placeholder="ABC-1234" className="uppercase" />
            </div>
            <div>
              <Label>Valor Diária (R$) *</Label>
              <Input type="number" value={valorDiaria} onChange={e => setValorDiaria(e.target.value)} placeholder="100.00" min="0" step="0.01" />
            </div>
          </div>
          <div>
            <Label>Tipo</Label>
            <Input value={tipo} onChange={e => setTipo(e.target.value)} placeholder="Ex: Carretinha Leve" />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="disponivel">Disponível</SelectItem>
                <SelectItem value="alugado">Alugado</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Salvando...' : 'Cadastrar Reboque'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
