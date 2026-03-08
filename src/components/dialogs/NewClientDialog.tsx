import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { store } from '@/lib/store';
import { toast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewClientDialog({ open, onOpenChange }: Props) {
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!name || !document || !phone) {
      toast({ title: 'Preencha nome, documento e telefone', variant: 'destructive' });
      return;
    }
    store.addClient({
      name,
      document,
      email,
      phone,
      address: { street, city, state, zip },
      notes,
    });
    toast({ title: 'Cliente cadastrado!', description: name });
    resetAndClose();
  };

  const resetAndClose = () => {
    setName(''); setDocument(''); setEmail(''); setPhone('');
    setStreet(''); setCity(''); setState(''); setZip(''); setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Novo Cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome Completo *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="João Silva" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>CPF/CNPJ *</Label>
              <Input value={document} onChange={e => setDocument(e.target.value)} placeholder="000.000.000-00" />
            </div>
            <div>
              <Label>Telefone *</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-0000" />
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
          </div>
          <div>
            <Label>Rua</Label>
            <Input value={street} onChange={e => setStreet(e.target.value)} placeholder="Rua das Flores, 123" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Cidade</Label>
              <Input value={city} onChange={e => setCity(e.target.value)} />
            </div>
            <div>
              <Label>Estado</Label>
              <Input value={state} onChange={e => setState(e.target.value)} maxLength={2} />
            </div>
            <div>
              <Label>CEP</Label>
              <Input value={zip} onChange={e => setZip(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anotações sobre o cliente..." rows={2} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={resetAndClose}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSubmit}>Cadastrar Cliente</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
