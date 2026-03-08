import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { StatCard } from '@/components/StatCard';
import {
  Building2, Users, Truck, FileText, CheckCircle, XCircle, Clock,
  MoreVertical, Eye, Ban, CreditCard,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Empresa {
  id: string;
  nome: string | null;
  email: string | null;
  plano: string | null;
  status: string | null;
  trial_ends_at: string | null;
  created_at: string | null;
}

interface EmpresaStats {
  empresa_id: string;
  total_reboques: number;
  total_clientes: number;
  total_alugueis: number;
  alugueis_ativos: number;
}

export default function AdminPage() {
  const { isSuperAdmin } = useAuth();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, EmpresaStats>>({});
  const [viewingEmpresa, setViewingEmpresa] = useState<Empresa | null>(null);

  const fetchEmpresas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Erro ao carregar empresas', description: error.message, variant: 'destructive' });
    } else {
      setEmpresas(data || []);
      // Fetch stats for each empresa
      await fetchAllStats(data || []);
    }
    setLoading(false);
  };

  const fetchAllStats = async (empresasList: Empresa[]) => {
    const statsMap: Record<string, EmpresaStats> = {};

    for (const empresa of empresasList) {
      const [reboques, clientes, alugueis] = await Promise.all([
        supabase.from('reboques').select('id', { count: 'exact', head: true }).eq('empresa_id', empresa.id),
        supabase.from('clientes').select('id', { count: 'exact', head: true }).eq('empresa_id', empresa.id),
        supabase.from('alugueis').select('id, status').eq('empresa_id', empresa.id),
      ]);

      const alugueisData = alugueis.data || [];
      statsMap[empresa.id] = {
        empresa_id: empresa.id,
        total_reboques: reboques.count || 0,
        total_clientes: clientes.count || 0,
        total_alugueis: alugueisData.length,
        alugueis_ativos: alugueisData.filter(a => a.status === 'ativo' || a.status === 'alugado').length,
      };
    }
    setStats(statsMap);
  };

  useEffect(() => {
    if (isSuperAdmin) fetchEmpresas();
  }, [isSuperAdmin]);

  const handleUpdateStatus = async (empresaId: string, newStatus: string) => {
    const updateData: Record<string, string | null> = { status: newStatus };
    if (newStatus === 'ativo') {
      updateData.plano = 'mensal';
    }

    const { error } = await supabase
      .from('empresas')
      .update(updateData)
      .eq('id', empresaId);

    if (error) {
      toast({ title: 'Erro ao atualizar empresa', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Empresa atualizada', description: `Status alterado para ${newStatus}.` });
      fetchEmpresas();
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-success/15 text-success border-success/30">Ativo</Badge>;
      case 'suspenso':
        return <Badge variant="destructive">Suspenso</Badge>;
      case 'trial':
        return <Badge className="bg-warning/15 text-warning border-warning/30">Trial</Badge>;
      default:
        return <Badge variant="secondary">{status || 'N/A'}</Badge>;
    }
  };

  const getPlanBadge = (plano: string | null) => {
    switch (plano) {
      case 'mensal':
        return <Badge className="bg-primary/15 text-primary border-primary/30">Mensal</Badge>;
      case 'trial':
        return <Badge variant="outline">Trial</Badge>;
      default:
        return <Badge variant="secondary">{plano || 'Sem plano'}</Badge>;
    }
  };

  const totalEmpresas = empresas.length;
  const empresasAtivas = empresas.filter(e => e.status === 'ativo').length;
  const empresasTrial = empresas.filter(e => e.status === 'trial' || (!e.plano || e.plano === 'trial')).length;
  const empresasSuspensas = empresas.filter(e => e.status === 'suspenso').length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Empresas" value={totalEmpresas} icon={Building2} color="primary" />
          <StatCard title="Empresas Ativas" value={empresasAtivas} icon={CheckCircle} color="success" />
          <StatCard title="Em Trial" value={empresasTrial} icon={Clock} color="warning" />
          <StatCard title="Suspensas" value={empresasSuspensas} icon={XCircle} color="destructive" />
        </div>

        {/* Companies Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Empresas Cadastradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Carregando...</p>
            ) : empresas.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma empresa cadastrada.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Trial até</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reboques</TableHead>
                    <TableHead>Clientes</TableHead>
                    <TableHead>Aluguéis</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empresas.map((empresa) => {
                    const empresaStats = stats[empresa.id];
                    return (
                      <motion.tr
                        key={empresa.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">{empresa.nome || 'Sem nome'}</TableCell>
                        <TableCell className="text-muted-foreground">{empresa.email || '-'}</TableCell>
                        <TableCell>{getPlanBadge(empresa.plano)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {empresa.trial_ends_at
                            ? format(parseISO(empresa.trial_ends_at), "dd/MM/yyyy", { locale: ptBR })
                            : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(empresa.status)}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Truck className="h-3 w-3" /> {empresaStats?.total_reboques ?? '...'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-3 w-3" /> {empresaStats?.total_clientes ?? '...'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <FileText className="h-3 w-3" /> {empresaStats?.total_alugueis ?? '...'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewingEmpresa(empresa)}>
                                <Eye className="h-4 w-4 mr-2" /> Ver detalhes
                              </DropdownMenuItem>
                              {empresa.status !== 'ativo' && (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(empresa.id, 'ativo')}>
                                  <CreditCard className="h-4 w-4 mr-2" /> Ativar plano
                                </DropdownMenuItem>
                              )}
                              {empresa.status !== 'suspenso' && (
                                <DropdownMenuItem
                                  onClick={() => handleUpdateStatus(empresa.id, 'suspenso')}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Ban className="h-4 w-4 mr-2" /> Suspender
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!viewingEmpresa} onOpenChange={() => setViewingEmpresa(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {viewingEmpresa?.nome || 'Detalhes da Empresa'}
            </DialogTitle>
          </DialogHeader>
          {viewingEmpresa && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{viewingEmpresa.email || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(viewingEmpresa.status)}</div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Plano</p>
                  <div className="mt-1">{getPlanBadge(viewingEmpresa.plano)}</div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Trial até</p>
                  <p className="text-sm font-medium">
                    {viewingEmpresa.trial_ends_at
                      ? format(parseISO(viewingEmpresa.trial_ends_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cadastro</p>
                  <p className="text-sm font-medium">
                    {viewingEmpresa.created_at
                      ? format(parseISO(viewingEmpresa.created_at), "dd/MM/yyyy", { locale: ptBR })
                      : '-'}
                  </p>
                </div>
              </div>

              {stats[viewingEmpresa.id] && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Estatísticas de Uso</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border bg-muted/30 p-3 text-center">
                      <Truck className="h-4 w-4 mx-auto text-primary mb-1" />
                      <p className="text-lg font-bold">{stats[viewingEmpresa.id].total_reboques}</p>
                      <p className="text-xs text-muted-foreground">Reboques</p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3 text-center">
                      <Users className="h-4 w-4 mx-auto text-primary mb-1" />
                      <p className="text-lg font-bold">{stats[viewingEmpresa.id].total_clientes}</p>
                      <p className="text-xs text-muted-foreground">Clientes</p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3 text-center">
                      <FileText className="h-4 w-4 mx-auto text-primary mb-1" />
                      <p className="text-lg font-bold">{stats[viewingEmpresa.id].total_alugueis}</p>
                      <p className="text-xs text-muted-foreground">Aluguéis Total</p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3 text-center">
                      <CheckCircle className="h-4 w-4 mx-auto text-success mb-1" />
                      <p className="text-lg font-bold">{stats[viewingEmpresa.id].alugueis_ativos}</p>
                      <p className="text-xs text-muted-foreground">Aluguéis Ativos</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {viewingEmpresa.status !== 'ativo' && (
                  <Button
                    onClick={() => { handleUpdateStatus(viewingEmpresa.id, 'ativo'); setViewingEmpresa(null); }}
                    className="flex-1"
                  >
                    <CreditCard className="h-4 w-4 mr-2" /> Ativar Plano
                  </Button>
                )}
                {viewingEmpresa.status !== 'suspenso' && (
                  <Button
                    variant="destructive"
                    onClick={() => { handleUpdateStatus(viewingEmpresa.id, 'suspenso'); setViewingEmpresa(null); }}
                    className="flex-1"
                  >
                    <Ban className="h-4 w-4 mr-2" /> Suspender
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
