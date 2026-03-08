import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/hooks/use-store';
import { store } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { differenceInDays } from 'date-fns';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewRentalDialog({ open, onOpenChange }: Props) {
  const { clients, trailers, models } = useStore();
  const [clientId, setClientId] = useState('');
  const [trailerId, setTrailerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [estimatedKm, setEstimatedKm] = useState('');

  const availableTrailers = trailers.filter(t => t.status === 'available');
  const selectedTrailer = trailers.find(t => t.id === trailerId);
  const model = selectedTrailer ? models.find(m => m.id === selectedTrailer.modelId) : null;

  const days = startDate && endDate ? Math.max(differenceInDays(new Date(endDate), new Date(startDate)), 1) : 0;
  const totalPrice = model ? days * model.dailyRate : 0;

  const handleSubmit = () => {
    if (!clientId || !trailerId || !startDate || !endDate || !estimatedKm) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    store.addRental({
      clientId,
      trailerId,
      startDate,
      endDate,
      estimatedKm: Number(estimatedKm),
      totalPrice,
      status: 'active',
    });
    toast({ title: 'Aluguel registrado!', description: `Total: R$ ${totalPrice.toFixed(2)}` });
    resetAndClose();
  };

  const resetAndClose = () => {
    setClientId(''); setTrailerId(''); setStartDate(''); setEndDate(''); setEstimatedKm('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Novo Aluguel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Cliente</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
              <SelectContent>
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name} — {c.document}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Reboque</Label>
            <Select value={trailerId} onValueChange={setTrailerId}>
              <SelectTrigger><SelectValue placeholder="Selecione o reboque" /></SelectTrigger>
              <SelectContent>
                {availableTrailers.map(t => {
                  const m = models.find(x => x.id === t.modelId);
                  return (
                    <SelectItem key={t.id} value={t.id}>
                      <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: t.color }} />
                      {t.plate} — {m?.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data Início</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>Data Fim</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Km Estimados</Label>
            <Input
              type="number"
              placeholder="Ex: 500"
              value={estimatedKm}
              onChange={e => setEstimatedKm(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Esses km serão adicionados ao reboque ao concluir o aluguel
            </p>
          </div>
          {totalPrice > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
              <p className="text-sm text-muted-foreground">{days} dia(s) × R$ {model?.dailyRate.toFixed(2)}/dia</p>
              <p className="text-2xl font-bold font-heading text-primary">R$ {totalPrice.toFixed(2)}</p>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={resetAndClose}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSubmit}>Registrar Aluguel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
