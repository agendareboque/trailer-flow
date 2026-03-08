import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useStore } from '@/hooks/use-store';
import { store, ALL_PAGES, type PermissionPage } from '@/lib/store';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import {
  Shield, UserPlus, Users, Clock, FileText, Wrench, UserCheck, UserX,
  MoreVertical, Pencil, Trash2, Eye, Phone, Mail, StickyNote,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Employee } from '@/lib/mock-data';

export default function SettingsPage() {
  const { employeePermissions, employees } = useStore();
  const [showNewEmployee, setShowNewEmployee] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const togglePermission = (page: PermissionPage) => {
    const current = Array.from(employeePermissions);
    const updated = current.includes(page)
      ? current.filter(p => p !== page)
      : [...current, page];
    store.setEmployeePermissions(updated);
    toast({ title: 'Permissões globais atualizadas' });
  };

  const activeCount = employees.filter(e => e.status === 'active').length;
  const inactiveCount = employees.filter(e => e.status === 'inactive').length;

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Configurações</h1>
        <p className="page-subtitle">Gerencie funcionários e permissões do sistema</p>
      </div>

      <Tabs defaultValue="employees" className="space-y-6">
        <TabsList>
          <TabsTrigger value="employees" className="gap-1.5">
            <Users className="h-4 w-4" /> Funcionários
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-1.5">
            <Shield className="h-4 w-4" /> Permissões Globais
          </TabsTrigger>
        </TabsList>

        {/* EMPLOYEES TAB */}
        <TabsContent value="employees" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card rounded-xl border p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-heading">{employees.length}</p>
                <p className="text-xs text-muted-foreground">Total de Funcionários</p>
              </div>
            </div>
            <div className="bg-card rounded-xl border p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold font-heading">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </div>
            </div>
            <div className="bg-card rounded-xl border p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <UserX className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold font-heading">{inactiveCount}</p>
                <p className="text-xs text-muted-foreground">Inativos</p>
              </div>
            </div>
          </div>

          {/* Action bar */}
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-semibold text-lg">Funcionários</h2>
            <Button onClick={() => setShowNewEmployee(true)} className="gap-1.5">
              <UserPlus className="h-4 w-4" /> Novo Funcionário
            </Button>
          </div>

          {/* Employee list */}
          <div className="bg-card rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Último Acesso</TableHead>
                    <TableHead className="hidden lg:table-cell text-center">Registros</TableHead>
                    <TableHead className="hidden lg:table-cell text-center">Permissões</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map(emp => (
                    <TableRow key={emp.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${emp.status === 'active' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{emp.name}</p>
                            <p className="text-xs text-muted-foreground">{emp.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${emp.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'active' ? 'bg-success' : 'bg-muted-foreground'}`} />
                          {emp.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div>
                          <p className="text-sm">
                            {formatDistanceToNow(parseISO(emp.lastActiveAt), { addSuffix: true, locale: ptBR })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(emp.lastActiveAt), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center justify-center gap-3 text-xs">
                          <span className="flex items-center gap-1" title="Aluguéis criados">
                            <FileText className="h-3 w-3 text-primary" /> {emp.totalRentalsCreated}
                          </span>
                          <span className="flex items-center gap-1" title="Clientes criados">
                            <Users className="h-3 w-3 text-success" /> {emp.totalClientsCreated}
                          </span>
                          <span className="flex items-center gap-1" title="Manutenções criadas">
                            <Wrench className="h-3 w-3 text-warning" /> {emp.totalMaintenanceCreated}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-center">
                        <span className="text-sm font-medium">{emp.permissions.length}/{ALL_PAGES.length}</span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewingEmployee(emp)}>
                              <Eye className="h-4 w-4 mr-2" /> Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingEmployee(emp)}>
                              <Pencil className="h-4 w-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              store.toggleEmployeeStatus(emp.id);
                              toast({ title: `Funcionário ${emp.status === 'active' ? 'desativado' : 'ativado'}` });
                            }}>
                              {emp.status === 'active' ? <UserX className="h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                              {emp.status === 'active' ? 'Desativar' : 'Ativar'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                store.removeEmployee(emp.id);
                                toast({ title: 'Funcionário removido' });
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* PERMISSIONS TAB */}
        <TabsContent value="permissions">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border p-6 max-w-lg"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-heading font-semibold">Permissões Globais do Funcionário</h2>
                <p className="text-sm text-muted-foreground">
                  Páginas que funcionários podem acessar por padrão
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {ALL_PAGES.map(page => (
                <div key={page.id} className="flex items-center gap-3">
                  <Checkbox
                    id={page.id}
                    checked={employeePermissions.has(page.id)}
                    onCheckedChange={() => togglePermission(page.id)}
                  />
                  <Label htmlFor={page.id} className="cursor-pointer">{page.label}</Label>
                </div>
              ))}
            </div>

            <div className="mt-6 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
              <p>💡 O Dashboard é sempre visível para todos os usuários.</p>
              <p>Administradores sempre têm acesso total.</p>
              <p>Cada funcionário pode ter permissões individuais configuradas na edição.</p>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* New Employee Dialog */}
      <NewEmployeeDialog open={showNewEmployee} onOpenChange={setShowNewEmployee} />

      {/* View Employee Dialog */}
      {viewingEmployee && (
        <ViewEmployeeDialog
          open={!!viewingEmployee}
          onOpenChange={v => !v && setViewingEmployee(null)}
          employee={viewingEmployee}
        />
      )}

      {/* Edit Employee Dialog */}
      {editingEmployee && (
        <EditEmployeeDialog
          open={!!editingEmployee}
          onOpenChange={v => !v && setEditingEmployee(null)}
          employee={editingEmployee}
        />
      )}
    </AppLayout>
  );
}

// ─── New Employee Dialog ───────────────────────────────────────
function NewEmployeeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [document, setDocument] = useState('');
  const [notes, setNotes] = useState('');
  const [permissions, setPermissions] = useState<string[]>(['trailers', 'clients', 'rentals', 'calendar', 'maintenance']);

  const togglePerm = (id: string) => {
    setPermissions(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleSubmit = () => {
    if (!name || !email) {
      toast({ title: 'Preencha nome e email', variant: 'destructive' });
      return;
    }
    store.addEmployee({ name, email, phone, document, notes, permissions, status: 'active' });
    toast({ title: 'Funcionário cadastrado!', description: name });
    setName(''); setEmail(''); setPhone(''); setDocument(''); setNotes('');
    setPermissions(['trailers', 'clients', 'rentals', 'calendar', 'maintenance']);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Novo Funcionário</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome Completo</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do funcionário" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@empresa.com" />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-0000" />
            </div>
          </div>
          <div>
            <Label>CPF / Documento</Label>
            <Input value={document} onChange={e => setDocument(e.target.value)} placeholder="000.000.000-00" />
          </div>
          <div>
            <Label>Permissões de Acesso</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {ALL_PAGES.map(page => (
                <div key={page.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`new-${page.id}`}
                    checked={permissions.includes(page.id)}
                    onCheckedChange={() => togglePerm(page.id)}
                  />
                  <Label htmlFor={`new-${page.id}`} className="text-sm cursor-pointer">{page.label}</Label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anotações sobre o funcionário..." rows={2} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSubmit}>Cadastrar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── View Employee Dialog ──────────────────────────────────────
function ViewEmployeeDialog({ open, onOpenChange, employee }: { open: boolean; onOpenChange: (v: boolean) => void; employee: Employee }) {
  const totalActions = employee.totalRentalsCreated + employee.totalClientsCreated + employee.totalMaintenanceCreated;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Detalhes do Funcionário</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${employee.status === 'active' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {employee.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{employee.name}</h3>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${employee.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${employee.status === 'active' ? 'bg-success' : 'bg-muted-foreground'}`} />
                {employee.status === 'active' ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{employee.email}</span>
            </div>
            {employee.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{employee.phone}</span>
              </div>
            )}
            {employee.document && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>{employee.document}</span>
              </div>
            )}
          </div>

          {/* Activity stats */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> Atividade
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Último acesso</p>
                <p className="font-medium">
                  {formatDistanceToNow(parseISO(employee.lastActiveAt), { addSuffix: true, locale: ptBR })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(employee.lastActiveAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Cadastrado em</p>
                <p className="font-medium">
                  {format(parseISO(employee.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground mb-2">Registros criados:</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-card rounded-lg p-2 text-center border">
                  <p className="text-lg font-bold text-primary">{employee.totalRentalsCreated}</p>
                  <p className="text-xs text-muted-foreground">Aluguéis</p>
                </div>
                <div className="bg-card rounded-lg p-2 text-center border">
                  <p className="text-lg font-bold text-success">{employee.totalClientsCreated}</p>
                  <p className="text-xs text-muted-foreground">Clientes</p>
                </div>
                <div className="bg-card rounded-lg p-2 text-center border">
                  <p className="text-lg font-bold text-warning">{employee.totalMaintenanceCreated}</p>
                  <p className="text-xs text-muted-foreground">Manutenções</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Total: <strong>{totalActions}</strong> registros
              </p>
            </div>
          </div>

          {/* Permissions */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Permissões ({employee.permissions.length}/{ALL_PAGES.length})</h4>
            <div className="flex flex-wrap gap-1.5">
              {ALL_PAGES.map(page => (
                <span
                  key={page.id}
                  className={`text-xs px-2 py-1 rounded-full ${employee.permissions.includes(page.id) ? 'bg-primary/10 text-primary font-medium' : 'bg-muted text-muted-foreground line-through'}`}
                >
                  {page.label}
                </span>
              ))}
            </div>
          </div>

          {/* Notes */}
          {employee.notes && (
            <div className="flex items-start gap-2 text-sm bg-warning/5 border border-warning/20 rounded-lg p-3">
              <StickyNote className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
              <p>{employee.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Employee Dialog ──────────────────────────────────────
function EditEmployeeDialog({ open, onOpenChange, employee }: { open: boolean; onOpenChange: (v: boolean) => void; employee: Employee }) {
  const [name, setName] = useState(employee.name);
  const [email, setEmail] = useState(employee.email);
  const [phone, setPhone] = useState(employee.phone);
  const [document, setDocument] = useState(employee.document);
  const [notes, setNotes] = useState(employee.notes || '');
  const [permissions, setPermissions] = useState<string[]>([...employee.permissions]);

  const togglePerm = (id: string) => {
    setPermissions(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleSubmit = () => {
    if (!name || !email) {
      toast({ title: 'Preencha nome e email', variant: 'destructive' });
      return;
    }
    store.updateEmployee(employee.id, { name, email, phone, document, notes, permissions });
    toast({ title: 'Funcionário atualizado!', description: name });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Editar Funcionário</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome Completo</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>CPF / Documento</Label>
            <Input value={document} onChange={e => setDocument(e.target.value)} />
          </div>
          <div>
            <Label>Permissões de Acesso</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {ALL_PAGES.map(page => (
                <div key={page.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`edit-${page.id}`}
                    checked={permissions.includes(page.id)}
                    onCheckedChange={() => togglePerm(page.id)}
                  />
                  <Label htmlFor={`edit-${page.id}`} className="text-sm cursor-pointer">{page.label}</Label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSubmit}>Salvar Alterações</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
