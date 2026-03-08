import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/hooks/use-store';
import { store } from '@/lib/store';
import { toast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewMaintenanceDialog({ open, onOpenChange }: Props) {
  const { trailers, models } = useStore();
  const [trailerId, setTrailerId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [km, setKm] = useState('');

  const selectedTrailer = trailers.find(t => t.id === trailerId);

  const handleSubmit = () => {
    if (!trailerId || !description || !cost || !km) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    store.addMaintenance({
      trailerId,
      date,
      description,
      cost: Number(cost),
      km: Number(km),
    });
    toast({ title: 'Manutenção registrada!', description });
    resetAndClose();
  };

  const resetAndClose = () => {
    setTrailerId(''); setDate(new Date().toISOString().split('T')[0]);
    setDescription(''); setCost(''); setKm('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Registrar Manutenção</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Reboque</Label>
            <Select value={trailerId} onValueChange={(v) => {
              setTrailerId(v);
              const t = trailers.find(x => x.id === v);
              if (t) setKm(String(t.totalKm));
            }}>
              <SelectTrigger><SelectValue placeholder="Selecione o reboque" /></SelectTrigger>
              <SelectContent>
                {trailers.map(t => {
                  const m = models.find(x => x.id === t.modelId);
                  return (
                    <SelectItem key={t.id} value={t.id}>
                      <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: t.color }} />
                      {t.plate} — {m?.name} ({t.totalKm.toLocaleString()} km)
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          {selectedTrailer && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p>Km atual: <strong>{selectedTrailer.totalKm.toLocaleString()}</strong></p>
              <p>Próx. manutenção: <strong>{selectedTrailer.nextMaintenanceKm.toLocaleString()} km</strong></p>
            </div>
          )}
          <div>
            <Label>Data</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Descrição do Serviço</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Troca de pneus, alinhamento..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Custo (R$)</Label>
              <Input type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="450.00" />
            </div>
            <div>
              <Label>Km no Momento</Label>
              <Input type="number" value={km} onChange={e => setKm(e.target.value)} placeholder="10000" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={resetAndClose}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSubmit}>Registrar Manutenção</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
