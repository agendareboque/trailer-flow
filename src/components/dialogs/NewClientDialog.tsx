import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated?: () => void;
}

export function NewClientDialog({ open, onOpenChange, onClientCreated }: Props) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [endereco, setEndereco] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!nome || !telefone) {
      toast.error('Preencha nome e telefone');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('clientes').insert({
      nome,
      telefone,
      cpf: cpf || null,
      endereco: endereco || null,
      observacoes: observacoes || null,
    });
    setLoading(false);

    if (error) {
      toast.error('Erro ao cadastrar cliente');
      console.error(error);
      return;
    }

    toast.success('Cliente cadastrado!');
    setNome(''); setTelefone(''); setCpf(''); setEndereco(''); setObservacoes('');
    onOpenChange(false);
    onClientCreated?.();
    window.dispatchEvent(new Event('clients-updated'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Novo Cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="João Silva" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>CPF/CNPJ</Label>
              <Input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" />
            </div>
            <div>
              <Label>Telefone *</Label>
              <Input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 99999-0000" />
            </div>
          </div>
          <div>
            <Label>Endereço</Label>
            <Input value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua das Flores, 123 - São Paulo/SP" />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Anotações sobre o cliente..." rows={2} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Salvando...' : 'Cadastrar Cliente'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
