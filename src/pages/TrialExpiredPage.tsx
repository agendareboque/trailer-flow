import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Clock, CreditCard, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TrialExpiredPage() {
  const { empresaId, signOut, refreshEmpresa } = useAuth();
  const [activating, setActivating] = useState(false);

  const handleActivatePlan = async () => {
    if (!empresaId) return;
    setActivating(true);

    const { error } = await supabase
      .from('empresas')
      .update({ plano: 'mensal', status: 'ativo' })
      .eq('id', empresaId);

    if (error) {
      toast({ title: 'Erro ao ativar plano', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Plano ativado!', description: 'Seu plano mensal foi ativado com sucesso.' });
      await refreshEmpresa();
    }
    setActivating(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-full max-w-md text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-warning/15 flex items-center justify-center">
              <Clock className="h-8 w-8 text-warning" />
            </div>
            <CardTitle className="text-2xl">Período de teste encerrado</CardTitle>
            <CardDescription className="text-base mt-2">
              Seu período de teste terminou. Para continuar usando o sistema, ative seu plano mensal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleActivatePlan}
              disabled={activating}
              className="w-full"
              size="lg"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {activating ? 'Ativando...' : 'Ativar plano mensal'}
            </Button>
            <Button
              variant="ghost"
              onClick={signOut}
              className="w-full text-muted-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
