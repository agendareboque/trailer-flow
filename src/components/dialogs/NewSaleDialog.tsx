import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { store } from '@/lib/store';
import { toast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const paymentMethods = [
  { value: 'pix', label: 'PIX' },
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'debit_card', label: 'Cartão de Débito' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'financing', label: 'Financiamento' },
];

export function NewSaleDialog({ open, onOpenChange }: Props) {
  const [type, setType] = useState<'purchase' | 'sale'>('purchase');
  const [trailerName, setTrailerName] = useState('');
  const [trailerPlate, setTrailerPlate] = useState('');
  const [buyerOrSeller, setBuyerOrSeller] = useState('');
  const [document, setDocument] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!trailerName || !trailerPlate || !buyerOrSeller || !price || !date || !paymentMethod) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }
    store.addSale({
      type,
      trailerName,
      trailerPlate,
      buyerOrSeller,
      document,
      price: Number(price),
      date,
      paymentMethod,
      notes,
    });
    toast({
      title: type === 'purchase' ? 'Compra registrada!' : 'Venda registrada!',
      description: `${trailerName} — R$ ${Number(price).toFixed(2)}`,
    });
    resetAndClose();
  };

  const resetAndClose = () => {
    setType('purchase'); setTrailerName(''); setTrailerPlate(''); setBuyerOrSeller('');
    setDocument(''); setPrice(''); setDate(''); setPaymentMethod(''); setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Registrar Compra/Venda</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Tipo</Label>
            <div className="flex gap-2 mt-1">
              <Button
                type="button" size="sm"
                variant={type === 'purchase' ? 'default' : 'outline'}
                onClick={() => setType('purchase')}
                className="flex-1"
              >Compra</Button>
              <Button
                type="button" size="sm"
                variant={type === 'sale' ? 'default' : 'outline'}
                onClick={() => setType('sale')}
                className="flex-1"
              >Venda</Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nome do Reboque *</Label>
              <Input value={trailerName} onChange={e => setTrailerName(e.target.value)} placeholder="Carretinha Leve #3" />
            </div>
            <div>
              <Label>Placa *</Label>
              <Input value={trailerPlate} onChange={e => setTrailerPlate(e.target.value)} placeholder="ABC-1234" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{type === 'purchase' ? 'Vendedor' : 'Comprador'} *</Label>
              <Input value={buyerOrSeller} onChange={e => setBuyerOrSeller(e.target.value)} placeholder="Nome ou Empresa" />
            </div>
            <div>
              <Label>CPF/CNPJ</Label>
              <Input value={document} onChange={e => setDocument(e.target.value)} placeholder="000.000.000-00" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor (R$) *</Label>
              <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="15000" />
            </div>
            <div>
              <Label>Data *</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Forma de Pagamento *</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {paymentMethods.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Detalhes da transação..." rows={2} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={resetAndClose}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSubmit}>
              {type === 'purchase' ? 'Registrar Compra' : 'Registrar Venda'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
