import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useStore } from '@/hooks/use-store';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { format, parseISO, differenceInDays, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, FileBarChart, Truck, Clock, DollarSign, TrendingUp, Download, BarChart3 } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { DateRange } from 'react-day-picker';

export default function ReportsPage() {
  const { trailers, rentals } = useStore();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2026, 0, 1),
    to: new Date(2026, 2, 8),
  });

  const report = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return null;

    const periodStart = dateRange.from;
    const periodEnd = dateRange.to;
    const totalPeriodDays = differenceInDays(periodEnd, periodStart) + 1;

    const trailerStats = trailers.map(trailer => {

      // All rentals for this trailer that overlap the selected period (not cancelled)
      const trailerRentals = rentals.filter(r => {
        if (r.trailerId !== trailer.id) return false;
        if (r.status === 'cancelled') return false;
        const rStart = parseISO(r.startDate);
        const rEnd = parseISO(r.endDate);
        // Overlap check
        return rStart <= periodEnd && rEnd >= periodStart;
      });

      // Calculate rented days within the period
      let rentedDays = 0;
      const rentedDaysSet = new Set<string>();

      trailerRentals.forEach(r => {
        const rStart = parseISO(r.startDate);
        const rEnd = parseISO(r.endDate);
        const overlapStart = rStart < periodStart ? periodStart : rStart;
        const overlapEnd = rEnd > periodEnd ? periodEnd : rEnd;
        
        if (overlapStart <= overlapEnd) {
          eachDayOfInterval({ start: overlapStart, end: overlapEnd }).forEach(day => {
            rentedDaysSet.add(format(day, 'yyyy-MM-dd'));
          });
        }
      });

      rentedDays = rentedDaysSet.size;
      const idleDays = totalPeriodDays - rentedDays;
      const occupancyRate = totalPeriodDays > 0 ? (rentedDays / totalPeriodDays) * 100 : 0;

      // Revenue within the period
      const revenue = trailerRentals.reduce((sum, r) => sum + r.totalPrice, 0);

      return {
        id: trailer.id,
        plate: trailer.plate,
        modelName: trailer.name,
        color: trailer.color,
        rentalCount: trailerRentals.length,
        rentedDays,
        idleDays,
        occupancyRate,
        revenue,
      };
    });

    // Sort by rental count descending
    trailerStats.sort((a, b) => b.rentalCount - a.rentalCount);

    const totalRentals = trailerStats.reduce((s, t) => s + t.rentalCount, 0);
    const totalRevenue = trailerStats.reduce((s, t) => s + t.revenue, 0);
    const avgOccupancy = trailerStats.length > 0
      ? trailerStats.reduce((s, t) => s + t.occupancyRate, 0) / trailerStats.length
      : 0;
    const neverRented = trailerStats.filter(t => t.rentalCount === 0);

    return {
      trailerStats,
      totalRentals,
      totalRevenue,
      avgOccupancy,
      totalPeriodDays,
      neverRented,
    };
  }, [dateRange, trailers, rentals, models]);

  const getOccupancyColor = (rate: number) => {
    if (rate >= 70) return 'text-success';
    if (rate >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const getBarColor = (rate: number) => {
    if (rate >= 70) return 'hsl(var(--success))';
    if (rate >= 40) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Relatórios</h1>
        <p className="page-subtitle">Análise detalhada de utilização da frota</p>
      </div>

      {/* Date range picker */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[300px] justify-start text-left font-normal",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} —{" "}
                    {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                  </>
                ) : (
                  format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                )
              ) : (
                <span>Selecione o período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              locale={ptBR}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {report && (
          <span className="text-sm text-muted-foreground">
            Período: {report.totalPeriodDays} dia(s)
          </span>
        )}
      </div>

      {report ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total de Aluguéis"
              value={report.totalRentals}
              icon={FileBarChart}
              color="primary"
            />
            <StatCard
              title="Receita no Período"
              value={`R$ ${report.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              icon={DollarSign}
              color="success"
            />
            <StatCard
              title="Ocupação Média"
              value={`${report.avgOccupancy.toFixed(1)}%`}
              icon={TrendingUp}
              color="primary"
            />
            <StatCard
              title="Nunca Alugados"
              value={report.neverRented.length}
              icon={Clock}
              color={report.neverRented.length > 0 ? 'warning' : 'success'}
            />
          </div>

          {/* Occupancy chart */}
          <div className="bg-card rounded-xl border p-6 mb-8">
            <h3 className="font-semibold font-heading mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Taxa de Ocupação por Reboque
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={report.trailerStats} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={v => `${v}%`}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  type="category"
                  dataKey="plate"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  width={75}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Ocupação']}
                />
                <Bar dataKey="occupancyRate" radius={[0, 4, 4, 0]}>
                  {report.trailerStats.map((entry, index) => (
                    <Cell key={index} fill={getBarColor(entry.occupancyRate)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed table */}
          <div className="bg-card rounded-xl border overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold font-heading flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Detalhamento por Reboque
              </h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reboque</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead className="text-center">Aluguéis</TableHead>
                    <TableHead className="text-center">Dias Alugado</TableHead>
                    <TableHead className="text-center">Dias Vazio</TableHead>
                    <TableHead className="text-center">Ocupação</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.trailerStats.map(t => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: t.color }}
                          />
                          <span className="font-medium">{t.plate}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{t.modelName}</TableCell>
                      <TableCell className="text-center font-medium">{t.rentalCount}</TableCell>
                      <TableCell className="text-center">
                        <span className="text-success font-medium">{t.rentedDays}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn(
                          "font-medium",
                          t.idleDays > t.rentedDays ? "text-destructive" : "text-muted-foreground"
                        )}>
                          {t.idleDays}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(t.occupancyRate, 100)}%`,
                                backgroundColor: getBarColor(t.occupancyRate),
                              }}
                            />
                          </div>
                          <span className={cn("text-sm font-medium", getOccupancyColor(t.occupancyRate))}>
                            {t.occupancyRate.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        R$ {t.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Never rented section */}
          {report.neverRented.length > 0 && (
            <div className="mt-6 bg-warning/5 border border-warning/20 rounded-xl p-5">
              <h4 className="font-semibold text-warning mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Reboques sem aluguéis no período
              </h4>
              <div className="flex flex-wrap gap-2">
                {report.neverRented.map(t => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="text-sm font-medium">{t.plate}</span>
                    <span className="text-xs text-muted-foreground">({t.modelName})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <FileBarChart className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">Selecione um período</p>
          <p className="text-sm">Escolha as datas para gerar o relatório completo da frota.</p>
        </div>
      )}
    </AppLayout>
  );
}
