import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/hooks/use-store';
import { store } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle } from 'lucide-react';

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
];

export function NewRentalDialog({ open, onOpenChange }: Props) {
  const { clients, trailers, models, rentals } = useStore();
  const [clientId, setClientId] = useState('');
  const [trailerId, setTrailerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [estimatedKm, setEstimatedKm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  // Show ALL trailers (not just available), excluding maintenance
  const bookableTrailers = trailers.filter(t => t.status !== 'maintenance');
  const selectedTrailer = trailers.find(t => t.id === trailerId);
  const model = selectedTrailer ? models.find(m => m.id === selectedTrailer.modelId) : null;

  const days = startDate && endDate ? Math.max(differenceInDays(new Date(endDate), new Date(startDate)), 1) : 0;
  const totalPrice = model ? days * model.dailyRate : 0;

  // Check for conflict
  const hasConflict = useMemo(() => {
    if (!trailerId || !startDate || !endDate) return false;
    return store.hasDateConflict(trailerId, startDate, endDate);
  }, [trailerId, startDate, endDate, rentals]);

  // Get existing bookings for selected trailer
  const bookings = useMemo(() => {
    if (!trailerId) return [];
    return store.getTrailerBookings(trailerId);
  }, [trailerId, rentals]);

  const handleSubmit = () => {
    if (!clientId || !trailerId || !startDate || !endDate || !estimatedKm || !paymentMethod) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    if (hasConflict) {
      toast({ title: 'Conflito de datas!', description: 'Esse reboque já está reservado nesse período.', variant: 'destructive' });
      return;
    }
    const result = store.addRental({
      clientId,
      trailerId,
      startDate,
      endDate,
      estimatedKm: Number(estimatedKm),
      totalPrice,
      status: 'active',
      paymentMethod,
    });
    if (result) {
      toast({ title: 'Aluguel registrado!', description: `Total: R$ ${totalPrice.toFixed(2)}` });
      resetAndClose();
    } else {
      toast({ title: 'Conflito de datas!', variant: 'destructive' });
    }
  };

  const resetAndClose = () => {
    setClientId(''); setTrailerId(''); setStartDate(''); setEndDate(''); setEstimatedKm(''); setPaymentMethod('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Novo Aluguel / Agendamento</DialogTitle>
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
                {bookableTrailers.map(t => {
                  const m = models.find(x => x.id === t.modelId);
                  return (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                        <span>{t.plate} — {m?.name}</span>
                        {t.status === 'rented' && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">em uso</span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Show existing bookings for selected trailer */}
          {bookings.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
              <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Reservas existentes:</p>
              {bookings.map(b => (
                <div key={b.id} className="flex justify-between text-xs">
                  <span>{b.clientName}</span>
                  <span className="text-muted-foreground">
                    {format(new Date(b.start), 'dd/MM')} — {format(new Date(b.end), 'dd/MM')}
                  </span>
                </div>
              ))}
            </div>
          )}

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

          {/* Conflict warning */}
          {hasConflict && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>Conflito de datas! Esse reboque já está reservado nesse período.</span>
            </div>
          )}

          <div>
            <Label>Km Estimados</Label>
            <Input type="number" placeholder="Ex: 500" value={estimatedKm} onChange={e => setEstimatedKm(e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">
              Esses km serão adicionados ao reboque ao concluir o aluguel
            </p>
          </div>

          <div>
            <Label>Forma de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue placeholder="Selecione a forma de pagamento" /></SelectTrigger>
              <SelectContent>
                {paymentMethods.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {totalPrice > 0 && !hasConflict && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
              <p className="text-sm text-muted-foreground">{days} dia(s) × R$ {model?.dailyRate.toFixed(2)}/dia</p>
              <p className="text-2xl font-bold font-heading text-primary">R$ {totalPrice.toFixed(2)}</p>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={resetAndClose}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={hasConflict}>
              Registrar Aluguel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
