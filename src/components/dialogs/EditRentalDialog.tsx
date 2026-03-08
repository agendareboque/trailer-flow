import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/hooks/use-store';
import { store } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { Rental, getPaymentLabel } from '@/lib/mock-data';
import { differenceInDays, format, parseISO, eachDayOfInterval } from 'date-fns';
import { AlertTriangle, Percent, DollarSign } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rental: Rental;
}

const paymentMethods = [
  { value: 'pix', label: 'PIX' },
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'debit_card', label: 'Cartão de Débito' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'boleto', label: 'Boleto' },
];

export function EditRentalDialog({ open, onOpenChange, rental }: Props) {
  const { clients, trailers, models, rentals } = useStore();
  const [clientId, setClientId] = useState(rental.clientId);
  const [trailerId, setTrailerId] = useState(rental.trailerId);
  const [startDate, setStartDate] = useState(rental.startDate);
  const [endDate, setEndDate] = useState(rental.endDate);
  const [estimatedKm, setEstimatedKm] = useState(String(rental.estimatedKm));
  const [paymentMethod, setPaymentMethod] = useState(rental.paymentMethod || '');
  const [discountType, setDiscountType] = useState<'none' | 'value' | 'percentage'>(rental.discountType || 'none');
  const [discountAmount, setDiscountAmount] = useState(rental.discountAmount ? String(rental.discountAmount) : '');

  // Reset form when rental changes
  useEffect(() => {
    setClientId(rental.clientId);
    setTrailerId(rental.trailerId);
    setStartDate(rental.startDate);
    setEndDate(rental.endDate);
    setEstimatedKm(String(rental.estimatedKm));
    setPaymentMethod(rental.paymentMethod || '');
    setDiscountType(rental.discountType || 'none');
    setDiscountAmount(rental.discountAmount ? String(rental.discountAmount) : '');
  }, [rental]);

  const bookableTrailers = trailers.filter(t => t.status !== 'maintenance');
  const selectedTrailer = trailers.find(t => t.id === trailerId);
  const model = selectedTrailer ? models.find(m => m.id === selectedTrailer.modelId) : null;

  const days = startDate && endDate ? Math.max(differenceInDays(new Date(endDate), new Date(startDate)), 1) : 0;
  const basePrice = model ? days * model.dailyRate : 0;

  const discountValue = useMemo(() => {
    if (discountType === 'none' || !discountAmount) return 0;
    const amt = Number(discountAmount);
    if (discountType === 'percentage') return basePrice * (amt / 100);
    return amt;
  }, [discountType, discountAmount, basePrice]);

  const totalPrice = Math.max(basePrice - discountValue, 0);

  const hasConflict = useMemo(() => {
    if (!trailerId || !startDate || !endDate) return false;
    return store.hasDateConflict(trailerId, startDate, endDate, rental.id);
  }, [trailerId, startDate, endDate, rentals, rental.id]);

  // Bookings for selected trailer (excluding current rental)
  const bookings = useMemo(() => {
    if (!trailerId) return [];
    return store.getTrailerBookings(trailerId).filter(b => b.id !== rental.id);
  }, [trailerId, rentals, rental.id]);

  const handleSubmit = () => {
    if (!clientId || !trailerId || !startDate || !endDate || !estimatedKm || !paymentMethod) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    if (hasConflict) {
      toast({ title: 'Conflito de datas!', variant: 'destructive' });
      return;
    }
    const success = store.updateRental(rental.id, {
      clientId,
      trailerId,
      startDate,
      endDate,
      estimatedKm: Number(estimatedKm),
      basePrice,
      discountType: discountType !== 'none' ? discountType : undefined,
      discountAmount: discountType !== 'none' ? Number(discountAmount) : undefined,
      totalPrice,
      paymentMethod,
    });
    if (success) {
      toast({ title: 'Aluguel atualizado!', description: `Total: R$ ${totalPrice.toFixed(2)}` });
      onOpenChange(false);
    } else {
      toast({ title: 'Conflito de datas!', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Editar Aluguel</DialogTitle>
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
                        {t.status === 'rented' && t.id !== rental.trailerId && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">em uso</span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {bookings.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Outras reservas deste reboque:</p>
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
            </div>
            <div>
              <Label>Data Fim</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
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

          <div>
            <Label>Desconto</Label>
            <div className="flex gap-2 mt-1">
              <Button type="button" size="sm" variant={discountType === 'none' ? 'default' : 'outline'}
                onClick={() => { setDiscountType('none'); setDiscountAmount(''); }}>Sem desconto</Button>
              <Button type="button" size="sm" variant={discountType === 'value' ? 'default' : 'outline'}
                onClick={() => setDiscountType('value')}><DollarSign className="h-3 w-3 mr-1" />Valor</Button>
              <Button type="button" size="sm" variant={discountType === 'percentage' ? 'default' : 'outline'}
                onClick={() => setDiscountType('percentage')}><Percent className="h-3 w-3 mr-1" />%</Button>
            </div>
            {discountType !== 'none' && (
              <Input type="number" className="mt-2"
                placeholder={discountType === 'percentage' ? 'Ex: 10' : 'Ex: 50.00'}
                value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} />
            )}
          </div>

          {basePrice > 0 && !hasConflict && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
              <p className="text-sm text-muted-foreground">{days} dia(s) × R$ {model?.dailyRate.toFixed(2)}/dia</p>
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
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={hasConflict}>
              Salvar Alterações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
