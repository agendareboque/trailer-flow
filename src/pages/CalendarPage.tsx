import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { mockTrailers, mockRentals, mockModels, getModelById } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 2, 1)); // March 2026

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad beginning to start on Sunday
  const startDay = monthStart.getDay();
  const paddedDays = Array.from({ length: startDay }).map(() => null).concat(days);

  const getTrailerRentals = (trailerId: string) => {
    return mockRentals.filter(r =>
      r.trailerId === trailerId &&
      r.status === 'active' &&
      isWithinInterval(monthStart, { start: parseISO(r.startDate), end: parseISO(r.endDate) }) ||
      isWithinInterval(monthEnd, { start: parseISO(r.startDate), end: parseISO(r.endDate) }) ||
      (parseISO(r.startDate) >= monthStart && parseISO(r.startDate) <= monthEnd)
    );
  };

  const isDayRented = (trailerId: string, day: Date) => {
    return mockRentals.some(r =>
      r.trailerId === trailerId &&
      r.status === 'active' &&
      isWithinInterval(day, { start: parseISO(r.startDate), end: parseISO(r.endDate) })
    );
  };

  const activeTrailers = mockTrailers.filter(t => t.status !== 'maintenance');

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Calendário</h1>
        <p className="page-subtitle">Visualize a disponibilidade dos reboques</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-bold font-heading capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="grid gap-px" style={{ gridTemplateColumns: `120px repeat(${days.length}, 1fr)` }}>
            <div className="p-2 text-sm font-medium text-muted-foreground bg-muted rounded-tl-lg">Reboque</div>
            {days.map(day => (
              <div key={day.toISOString()} className="p-1 text-center text-xs text-muted-foreground bg-muted">
                <div className="font-medium">{format(day, 'd')}</div>
                <div className="uppercase">{format(day, 'EEE', { locale: ptBR }).slice(0, 3)}</div>
              </div>
            ))}
          </div>

          {/* Rows */}
          {activeTrailers.map(trailer => {
            const model = getModelById(trailer.modelId);
            return (
              <div
                key={trailer.id}
                className="grid gap-px border-b"
                style={{ gridTemplateColumns: `120px repeat(${days.length}, 1fr)` }}
              >
                <div className="p-2 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: trailer.color }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{trailer.plate}</p>
                    <p className="text-xs text-muted-foreground truncate">{model?.name}</p>
                  </div>
                </div>
                {days.map(day => {
                  const rented = isDayRented(trailer.id, day);
                  return (
                    <div
                      key={day.toISOString()}
                      className="p-1 flex items-center justify-center"
                    >
                      <div
                        className="w-full h-6 rounded-sm transition-colors"
                        style={{
                          backgroundColor: rented ? trailer.color : 'hsl(var(--muted))',
                          opacity: rented ? 0.8 : 0.3,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary/80" />
          <span>Alugado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-muted" />
          <span>Disponível</span>
        </div>
      </div>
    </AppLayout>
  );
}
