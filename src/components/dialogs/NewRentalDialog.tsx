import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/hooks/use-store';
import { store } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { differenceInDays, format, parseISO, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, Percent, DollarSign } from 'lucide-react';
import { InlineNewClientForm } from './InlineNewClientForm';

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
  const { clients, trailers, rentals } = useStore();
  const [clientId, setClientId] = useState('');
  const [trailerId, setTrailerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [estimatedKm, setEstimatedKm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [discountType, setDiscountType] = useState<'none' | 'value' | 'percentage'>('none');
  const [discountAmount, setDiscountAmount] = useState('');

  const bookableTrailers = trailers.filter(t => t.status !== 'maintenance');
  const selectedTrailer = trailers.find(t => t.id === trailerId);

  const days = startDate && endDate ? Math.max(differenceInDays(new Date(endDate), new Date(startDate)), 1) : 0;
  const basePrice = selectedTrailer ? days * selectedTrailer.dailyRate : 0;

  // Calculate discount
  const discountValue = useMemo(() => {
    if (discountType === 'none' || !discountAmount) return 0;
    const amt = Number(discountAmount);
    if (discountType === 'percentage') return basePrice * (amt / 100);
    return amt;
  }, [discountType, discountAmount, basePrice]);

  const totalPrice = Math.max(basePrice - discountValue, 0);

  const hasConflict = useMemo(() => {
    if (!trailerId || !startDate || !endDate) return false;
    return store.hasDateConflict(trailerId, startDate, endDate);
  }, [trailerId, startDate, endDate, rentals]);

  const bookings = useMemo(() => {
    if (!trailerId) return [];
    return store.getTrailerBookings(trailerId);
  }, [trailerId, rentals]);

  // Get booked days for mini calendar display
  const bookedDays = useMemo(() => {
    if (!trailerId) return new Map<string, string>();
    const map = new Map<string, string>();
    bookings.forEach(b => {
      try {
        const days = eachDayOfInterval({ start: parseISO(b.start), end: parseISO(b.end) });
        days.forEach(d => map.set(format(d, 'yyyy-MM-dd'), b.clientName));
      } catch {}
    });
    return map;
  }, [bookings, trailerId]);

  const handleSubmit = () => {
    if (!clientId || !trailerId || !startDate || !endDate || !estimatedKm || !paymentMethod) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    if (hasConflict) {
      toast({ title: 'Conflito de datas!', variant: 'destructive' });
      return;
    }
    const result = store.addRental({
      clientId,
      trailerId,
      startDate,
      endDate,
      estimatedKm: Number(estimatedKm),
      basePrice,
      discountType: discountType !== 'none' ? discountType : undefined,
      discountAmount: discountType !== 'none' ? Number(discountAmount) : undefined,
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
    setClientId(''); setTrailerId(''); setStartDate(''); setEndDate('');
    setEstimatedKm(''); setPaymentMethod(''); setDiscountType('none'); setDiscountAmount('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
            <InlineNewClientForm onClientCreated={(id) => setClientId(id)} />
          </div>
          <div>
            <Label>Reboque</Label>
            <Select value={trailerId} onValueChange={setTrailerId}>
              <SelectTrigger><SelectValue placeholder="Selecione o reboque" /></SelectTrigger>
              <SelectContent>
                {bookableTrailers.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                      <span>{t.plate} — {t.name}</span>
                      {t.status === 'rented' && (
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">em uso</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mini calendar showing booked periods */}
          {bookings.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Períodos reservados:</p>
              {bookings.map(b => (
                <div key={b.id} className="flex items-center gap-2 text-xs">
                  <div className="w-full bg-destructive/15 rounded px-2 py-1 flex justify-between">
                    <span className="font-medium text-destructive">{b.clientName}</span>
                    <span className="text-muted-foreground">
                      {format(parseISO(b.start), 'dd/MM/yy')} → {format(parseISO(b.end), 'dd/MM/yy')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data Início</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              {startDate && bookedDays.has(startDate) && (
                <p className="text-xs text-destructive mt-1">⚠ Dia ocupado por {bookedDays.get(startDate)}</p>
              )}
            </div>
            <div>
              <Label>Data Fim</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              {endDate && bookedDays.has(endDate) && (
                <p className="text-xs text-destructive mt-1">⚠ Dia ocupado por {bookedDays.get(endDate)}</p>
              )}
            </div>
          </div>

          {hasConflict && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>Conflito de datas! Esse reboque já está reservado nesse período.</span>
            </div>
          )}

          <div>
            <Label>Km Estimados</Label>
            <Input type="number" placeholder="Ex: 500" value={estimatedKm} onChange={e => setEstimatedKm(e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">Adicionados ao reboque ao concluir</p>
          </div>

          <div>
            <Label>Forma de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {paymentMethods.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Discount section */}
          <div>
            <Label>Desconto</Label>
            <div className="flex gap-2 mt-1">
              <Button
                type="button" size="sm" variant={discountType === 'none' ? 'default' : 'outline'}
                onClick={() => { setDiscountType('none'); setDiscountAmount(''); }}
              >Sem desconto</Button>
              <Button
                type="button" size="sm" variant={discountType === 'value' ? 'default' : 'outline'}
                onClick={() => setDiscountType('value')}
              ><DollarSign className="h-3 w-3 mr-1" />Valor</Button>
              <Button
                type="button" size="sm" variant={discountType === 'percentage' ? 'default' : 'outline'}
                onClick={() => setDiscountType('percentage')}
              ><Percent className="h-3 w-3 mr-1" />%</Button>
            </div>
            {discountType !== 'none' && (
              <Input
                type="number"
                className="mt-2"
                placeholder={discountType === 'percentage' ? 'Ex: 10' : 'Ex: 50.00'}
                value={discountAmount}
                onChange={e => setDiscountAmount(e.target.value)}
              />
            )}
          </div>

          {basePrice > 0 && !hasConflict && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
              <p className="text-sm text-muted-foreground">{days} dia(s) × R$ {selectedTrailer?.dailyRate.toFixed(2)}/dia</p>
              {discountValue > 0 && (
                <p className="text-sm text-success">
                  Desconto: -R$ {discountValue.toFixed(2)}
                  {discountType === 'percentage' && ` (${discountAmount}%)`}
                </p>
              )}
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
