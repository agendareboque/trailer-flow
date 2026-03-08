import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/hooks/use-store';
import { store } from '@/lib/store';
import { toast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultColors = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d', '#4f46e5', '#65a30d', '#ea580c'];

export function NewTrailerDialog({ open, onOpenChange }: Props) {
  const { models } = useStore();
  const [modelId, setModelId] = useState('');
  const [plate, setPlate] = useState('');
  const [color, setColor] = useState(defaultColors[0]);
  const [nextMaintKm, setNextMaintKm] = useState('5000');

  const handleSubmit = () => {
    if (!modelId || !plate) {
      toast({ title: 'Preencha modelo e placa', variant: 'destructive' });
      return;
    }
    store.addTrailer({
      modelId,
      plate: plate.toUpperCase(),
      color,
      status: 'available',
      nextMaintenanceKm: Number(nextMaintKm) || 5000,
    });
    toast({ title: 'Reboque cadastrado!', description: plate.toUpperCase() });
    resetAndClose();
  };

  const resetAndClose = () => {
    setModelId(''); setPlate(''); setColor(defaultColors[0]); setNextMaintKm('5000');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Novo Reboque</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Modelo</Label>
            <Select value={modelId} onValueChange={setModelId}>
              <SelectTrigger><SelectValue placeholder="Selecione o modelo" /></SelectTrigger>
              <SelectContent>
                {models.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name} — R$ {m.dailyRate}/dia</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Placa</Label>
            <Input value={plate} onChange={e => setPlate(e.target.value)} placeholder="ABC-1234" className="uppercase" />
          </div>
          <div>
            <Label>Cor de Identificação</Label>
            <div className="flex gap-2 mt-1.5">
              {defaultColors.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div>
            <Label>Km para Primeira Manutenção</Label>
            <Input type="number" value={nextMaintKm} onChange={e => setNextMaintKm(e.target.value)} placeholder="5000" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={resetAndClose}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSubmit}>Cadastrar Reboque</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
