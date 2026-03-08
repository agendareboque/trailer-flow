import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserPlus, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  empresaId: string;
  onCreated: (id: string) => void;
  onCancel: () => void;
}

export function InlineNewClientForm({ empresaId, onCreated, onCancel }: Props) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [endereco, setEndereco] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!nome.trim() || !telefone.trim()) {
      toast.error('Nome e telefone são obrigatórios');
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from('clientes')
      .insert({
        nome: nome.trim(),
        telefone: telefone.trim(),
        cpf: cpf.trim() || null,
        endereco: endereco.trim() || null,
        observacoes: observacoes.trim() || null,
        empresa_id: empresaId,
      })
      .select('id')
      .single();

    setSaving(false);
    if (error) {
      toast.error('Erro ao cadastrar cliente');
      console.error(error);
      return;
    }
    toast.success('Cliente cadastrado!');
    onCreated(data.id);
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="border border-dashed border-primary/30 rounded-lg p-3 space-y-3 bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <UserPlus className="h-4 w-4" />
            Novo Cliente
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="h-6 w-6 p-0">
            <X className="h-3 w-3" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Nome *</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Telefone *</Label>
            <Input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 00000-0000" className="h-8 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">CPF</Label>
            <Input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Endereço</Label>
            <Input value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua, nº" className="h-8 text-sm" />
          </div>
        </div>
        <div>
          <Label className="text-xs">Observações</Label>
          <Input value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Opcional" className="h-8 text-sm" />
        </div>
        <Button size="sm" className="w-full h-8 text-xs" onClick={handleSave} disabled={saving}>
          <UserPlus className="h-3.5 w-3.5 mr-1" />
          {saving ? 'Salvando...' : 'Cadastrar e Selecionar'}
        </Button>
      </div>
    </motion.div>
  );
}
