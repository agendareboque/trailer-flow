import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useStore } from '@/hooks/use-store';
import { StatCard } from '@/components/StatCard';
import { DollarSign, TrendingUp, FileText, BarChart3 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { isWithinInterval, subDays, startOfMonth, endOfMonth, subMonths, parseISO, startOfDay, endOfDay } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const periods = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: '7days', label: 'Últimos 7 dias' },
  { value: '14days', label: 'Últimos 14 dias' },
  { value: '30days', label: 'Últimos 30 dias' },
  { value: 'thisMonth', label: 'Mês atual' },
  { value: 'lastMonth', label: 'Mês anterior' },
];

function getDateRange(period: string): { start: Date; end: Date } {
  const now = new Date(2026, 2, 8);
  switch (period) {
    case 'today': return { start: startOfDay(now), end: endOfDay(now) };
    case 'yesterday': return { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) };
    case '7days': return { start: subDays(now, 7), end: now };
    case '14days': return { start: subDays(now, 14), end: now };
    case '30days': return { start: subDays(now, 30), end: now };
    case 'thisMonth': return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'lastMonth': return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
    default: return { start: subDays(now, 30), end: now };
  }
}

export default function FinancialPage() {
  const { rentals } = useStore();
  const [period, setPeriod] = useState('30days');
  const { start, end } = getDateRange(period);

  const filteredRentals = rentals.filter(r => {
    const created = parseISO(r.createdAt);
    return r.status !== 'cancelled' && isWithinInterval(created, { start, end });
  });

  const totalRevenue = filteredRentals.reduce((sum, r) => sum + r.totalPrice, 0);
  const avgTicket = filteredRentals.length > 0 ? totalRevenue / filteredRentals.length : 0;
  const completedCount = filteredRentals.filter(r => r.status === 'completed').length;

  const chartData = filteredRentals.reduce((acc, r) => {
    const month = r.createdAt.slice(0, 7);
    const existing = acc.find(a => a.month === month);
    if (existing) { existing.value += r.totalPrice; } else { acc.push({ month, value: r.totalPrice }); }
    return acc;
  }, [] as { month: string; value: number }[]).sort((a, b) => a.month.localeCompare(b.month));

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Dashboard Financeiro</h1>
        <p className="page-subtitle">Análise de receita e performance</p>
      </div>
      <div className="mb-6">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>{periods.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Receita Total" value={`R$ ${totalRevenue.toFixed(2)}`} icon={DollarSign} color="success" />
        <StatCard title="Ticket Médio" value={`R$ ${avgTicket.toFixed(2)}`} icon={TrendingUp} color="primary" />
        <StatCard title="Aluguéis no Período" value={filteredRentals.length} icon={FileText} color="primary" />
        <StatCard title="Concluídos" value={completedCount} icon={BarChart3} color="success" />
      </div>
      {chartData.length > 0 && (
        <div className="bg-card rounded-xl border p-6">
          <h3 className="font-semibold font-heading mb-4">Receita por Período</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={v => `R$${v}`} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Receita']} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </AppLayout>
  );
}
