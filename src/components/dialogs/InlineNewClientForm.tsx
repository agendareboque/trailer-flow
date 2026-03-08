import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { store } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { UserPlus, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onClientCreated: (clientId: string) => void;
}

export function InlineNewClientForm({ onClientCreated }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = () => {
    if (!name || !document || !phone) {
      toast({ title: 'Preencha nome, documento e telefone', variant: 'destructive' });
      return;
    }
    const client = store.addClient({
      name,
      document,
      email,
      phone,
      address: { street: '', city: '', state: '', zip: '' },
      notes: '',
    });
    toast({ title: 'Cliente cadastrado!', description: name });
    onClientCreated(client.id);
    setName(''); setDocument(''); setPhone(''); setEmail('');
    setExpanded(false);
  };

  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-xs text-primary gap-1 px-0 h-auto"
        onClick={() => setExpanded(!expanded)}
      >
        <UserPlus className="h-3.5 w-3.5" />
        Cadastrar novo cliente
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </Button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 space-y-3">
              <div>
                <Label className="text-xs">Nome *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="João Silva" className="h-8 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">CPF/CNPJ *</Label>
                  <Input value={document} onChange={e => setDocument(e.target.value)} placeholder="000.000.000-00" className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Telefone *</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-0000" className="h-8 text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" className="h-8 text-sm" />
              </div>
              <Button size="sm" className="w-full h-8 text-xs" onClick={handleSubmit}>
                <UserPlus className="h-3.5 w-3.5 mr-1" /> Cadastrar e Selecionar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
