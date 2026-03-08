import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { mockClients, getScoreColor } from '@/lib/mock-data';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Search, Mail, Phone, MapPin, Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  const filtered = mockClients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.document.includes(search) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const client = selectedClient ? mockClients.find(c => c.id === selectedClient) : null;

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Clientes</h1>
        <p className="page-subtitle">Gerencie seus clientes e avaliações</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, documento ou email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl border p-5 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedClient(c.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold font-heading">{c.name}</h3>
                <p className="text-sm text-muted-foreground">{c.document}</p>
              </div>
              <div className={`text-2xl font-bold font-heading ${getScoreColor(c.score)}`}>
                {c.score}
              </div>
            </div>

            <div className="space-y-1.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{c.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" />
                <span>{c.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">{c.address.city}, {c.address.state}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs text-muted-foreground">
              <span>{c.totalRentals} aluguéis</span>
              {c.lateReturns > 0 && (
                <span className="text-destructive">{c.lateReturns} atrasos</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <Dialog open={!!client} onOpenChange={() => setSelectedClient(null)}>
        {client && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading">{client.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={`text-4xl font-bold font-heading ${getScoreColor(client.score)}`}>
                  {client.score}
                </div>
                <div>
                  <p className="text-sm font-medium">Score de Confiabilidade</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(client.score / 20) ? 'text-warning fill-warning' : 'text-muted'}`} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Documento</span>
                  <p className="font-medium">{client.document}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email</span>
                  <p className="font-medium">{client.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Telefone</span>
                  <p className="font-medium">{client.phone}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Cidade</span>
                  <p className="font-medium">{client.address.city}, {client.address.state}</p>
                </div>
              </div>

              <div className="text-sm">
                <span className="text-muted-foreground">Endereço</span>
                <p className="font-medium">{client.address.street}, {client.address.zip}</p>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-muted rounded-lg text-center text-sm">
                <div>
                  <p className="text-lg font-bold font-heading">{client.totalRentals}</p>
                  <p className="text-muted-foreground text-xs">Aluguéis</p>
                </div>
                <div>
                  <p className="text-lg font-bold font-heading text-destructive">{client.lateReturns}</p>
                  <p className="text-muted-foreground text-xs">Atrasos</p>
                </div>
                <div>
                  <p className="text-lg font-bold font-heading">{client.score}</p>
                  <p className="text-muted-foreground text-xs">Score</p>
                </div>
              </div>

              {client.notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Observações</span>
                  <p className="mt-1 p-2 bg-muted rounded">{client.notes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </AppLayout>
  );
}
