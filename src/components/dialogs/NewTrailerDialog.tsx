import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { store } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { ImagePlus, FileText } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultColors = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d', '#4f46e5', '#65a30d', '#ea580c'];

export function NewTrailerDialog({ open, onOpenChange }: Props) {
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [maintenanceKm, setMaintenanceKm] = useState('5000');
  const [color, setColor] = useState(defaultColors[0]);
  const [notes, setNotes] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocumentName(file.name);
    }
  };

  const handleSubmit = () => {
    if (!name || !plate || !dailyRate) {
      toast({ title: 'Preencha nome, placa e valor da diária', variant: 'destructive' });
      return;
    }
    store.addTrailer({
      modelId: '',
      name,
      plate: plate.toUpperCase(),
      dailyRate: Number(dailyRate),
      color,
      status: 'available',
      maintenanceIntervalKm: Number(maintenanceKm) || 5000,
      imageUrl: imagePreview || undefined,
      documentUrl: documentName || undefined,
      notes: notes || undefined,
    });
    toast({ title: 'Reboque cadastrado!', description: `${name} — ${plate.toUpperCase()}` });
    resetAndClose();
  };

  const resetAndClose = () => {
    setName(''); setPlate(''); setDailyRate(''); setMaintenanceKm('5000');
    setColor(defaultColors[0]); setNotes(''); setImagePreview(null); setDocumentName(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Novo Reboque</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Photo */}
          <div>
            <Label>Foto do Reboque</Label>
            <div className="mt-1.5">
              {imagePreview ? (
                <div className="relative group">
                  <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg border" />
                  <button
                    onClick={() => setImagePreview(null)}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                  <ImagePlus className="h-8 w-8 text-muted-foreground mb-1" />
                  <span className="text-sm text-muted-foreground">Clique para adicionar foto</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              )}
            </div>
          </div>

          {/* Name */}
          <div>
            <Label>Nome do Reboque</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Carretinha Leve 1" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Plate */}
            <div>
              <Label>Placa / Identificação</Label>
              <Input value={plate} onChange={e => setPlate(e.target.value)} placeholder="ABC-1234" className="uppercase" />
            </div>
            {/* Daily rate */}
            <div>
              <Label>Valor da Diária (R$)</Label>
              <Input type="number" value={dailyRate} onChange={e => setDailyRate(e.target.value)} placeholder="100.00" min="0" step="0.01" />
            </div>
          </div>

          {/* Maintenance interval */}
          <div>
            <Label>Preventiva a cada (km)</Label>
            <Input type="number" value={maintenanceKm} onChange={e => setMaintenanceKm(e.target.value)} placeholder="5000" min="0" />
            <p className="text-xs text-muted-foreground mt-1">Intervalo de quilometragem para manutenção preventiva</p>
          </div>

          {/* Color */}
          <div>
            <Label>Cor de Identificação</Label>
            <div className="flex gap-2 mt-1.5">
              {defaultColors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Document */}
          <div>
            <Label>Documento (CRLV, Nota Fiscal, etc.)</Label>
            <div className="mt-1.5">
              {documentName ? (
                <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
                  <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm truncate flex-1">{documentName}</span>
                  <button onClick={() => setDocumentName(null)} className="text-xs text-destructive hover:underline">Remover</button>
                </div>
              ) : (
                <label className="flex items-center gap-2 border border-dashed border-muted-foreground/30 rounded-lg p-3 cursor-pointer hover:border-primary/50 transition-colors">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Clique para anexar documento</span>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden" onChange={handleDocumentChange} />
                </label>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Observações</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observações sobre o reboque..." rows={3} />
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
