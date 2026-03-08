import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated?: () => void;
}

export function NewClientDialog({ open, onOpenChange, onClientCreated }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !phone) {
      toast.error('Preencha nome e telefone');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('clientes').insert({ nome: name, telefone: phone });
    setLoading(false);

    if (error) {
      toast.error('Erro ao cadastrar cliente');
      console.error(error);
      return;
    }

    toast.success('Cliente cadastrado!');
    setName('');
    setPhone('');
    onOpenChange(false);
    onClientCreated?.();
    window.dispatchEvent(new Event('clients-updated'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Novo Cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="João Silva" />
          </div>
          <div>
            <Label>Telefone *</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-0000" />
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
