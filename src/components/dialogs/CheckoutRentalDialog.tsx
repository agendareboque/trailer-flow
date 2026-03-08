import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Rental } from '@/lib/mock-data';
import { store } from '@/lib/store';
import { useStore } from '@/hooks/use-store';
import { toast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rental: Rental;
}

export function CheckoutRentalDialog({ open, onOpenChange, rental }: Props) {
  const { clients, trailers } = useStore();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [actualKm, setActualKm] = useState(String(rental.estimatedKm));
  const [comment, setComment] = useState('');

  const client = clients.find(c => c.id === rental.clientId);
  const trailer = trailers.find(t => t.id === rental.trailerId);

  const handleSubmit = () => {
    if (rating === 0) {
      toast({ title: 'Avalie o cliente antes de finalizar', variant: 'destructive' });
      return;
    }

    store.completeRental(
      rental.id,
      Number(actualKm) || rental.estimatedKm,
      { rating, comment: comment.trim() || undefined }
    );

    toast({
      title: 'Locação finalizada!',
      description: `${client?.name} avaliado com ${rating} estrela(s).`,
    });

    // Reset
    setRating(0);
    setHoverRating(0);
    setActualKm('');
    setComment('');
    onOpenChange(false);
  };

  const displayRating = hoverRating || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Dar Baixa na Locação</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* Rental summary */}
          <div className="bg-muted rounded-lg p-4 space-y-1">
            <p className="font-semibold font-heading">{client?.name}</p>
            <p className="text-sm text-muted-foreground">
              {trailer?.name} • {trailer?.plate}
            </p>
            <p className="text-sm text-muted-foreground">
              Valor: <span className="font-semibold text-foreground">R$ {rental.totalPrice.toFixed(2)}</span>
            </p>
          </div>

          {/* Actual KM */}
          <div>
            <Label>Km Percorridos (real)</Label>
            <Input
              type="number"
              placeholder={`Estimado: ${rental.estimatedKm} km`}
              value={actualKm}
              onChange={e => setActualKm(e.target.value)}
            />
          </div>

          {/* Star Rating */}
          <div>
            <Label className="mb-2 block">Avaliação do Cliente</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  className="p-1 transition-transform hover:scale-110"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={cn(
                      'h-8 w-8 transition-colors',
                      star <= displayRating
                        ? 'text-warning fill-warning'
                        : 'text-muted-foreground/30'
                    )}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm font-medium text-muted-foreground">
                  {rating}/5
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {rating === 0 && 'Clique nas estrelas para avaliar'}
              {rating === 1 && 'Péssimo'}
              {rating === 2 && 'Ruim'}
              {rating === 3 && 'Regular'}
              {rating === 4 && 'Bom'}
              {rating === 5 && 'Excelente'}
            </p>
          </div>

          {/* Observations */}
          <div>
            <Label>Observações da locação</Label>
            <Textarea
              placeholder="Ex: Cliente devolveu em bom estado, sem avarias..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleSubmit}>
              Finalizar Locação
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
