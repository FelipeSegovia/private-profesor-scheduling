import { Check, MoreHorizontal } from 'lucide-react'
import type { Session, SessionStatus, WeekDay } from '@/data/dashboard'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AgendaCardProps {
  monthLabel: string
  weekDays: WeekDay[]
  selectedDate: string
  dayTitle: string
  sessions: Session[]
  onSelectDate: (date: string) => void
  onPrevWeek: () => void
  onNextWeek: () => void
}

function StatusBadge({ status }: { status: SessionStatus }) {
  if (status === 'confirmada') {
    return (
      <Badge className="gap-1 border-transparent bg-success-soft text-success hover:bg-success-soft">
        <Check className="size-3" strokeWidth={3} />
        Confirmada
      </Badge>
    )
  }

  return (
    <Badge className="border-transparent bg-warning-soft text-warning hover:bg-warning-soft">
      Pendiente
    </Badge>
  )
}

export function AgendaCard({
  monthLabel,
  weekDays,
  selectedDate,
  dayTitle,
  sessions,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
}: AgendaCardProps) {
  return (
    <Card className="rounded-2xl shadow-sm ring-border">
      <CardHeader>
        <CardTitle className="font-serif text-2xl tracking-tight">Mi agenda</CardTitle>
        <CardDescription>Revisa tus próximas sesiones</CardDescription>
        <CardAction>
          <Button type="button" variant="link" className="h-auto px-0 text-primary">
            Ver agenda completa →
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Semana anterior"
            onClick={onPrevWeek}
          >
            ‹
          </Button>
          <p className="text-sm font-semibold text-foreground">{monthLabel}</p>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Semana siguiente"
            onClick={onNextWeek}
          >
            ›
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {weekDays.map((day) => {
            const selected = day.date === selectedDate
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => onSelectDate(day.date)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 transition',
                  selected
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'border border-transparent bg-background text-foreground hover:border-border hover:bg-secondary',
                )}
              >
                <span
                  className={cn(
                    'text-[10px] font-semibold tracking-wide uppercase',
                    selected ? 'opacity-90' : 'text-muted-foreground',
                  )}
                >
                  {day.dayLabel}
                </span>
                <span className="text-sm font-semibold sm:text-base">
                  {day.dayNumber}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-foreground">{dayTitle}</h3>
            <p className="text-sm text-muted-foreground">
              {sessions.length === 0
                ? 'Sin sesiones programadas'
                : `${sessions.length} ${sessions.length === 1 ? 'sesión programada' : 'sesiones programadas'}`}
            </p>
          </div>
          <Badge variant="secondary" className="text-primary">
            Hora de Chile
          </Badge>
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center">
            <p className="text-sm font-medium text-foreground">
              No hay sesiones este día
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Elige otro día de la semana o agenda una nueva cita.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background px-3 py-3 sm:flex-nowrap sm:gap-4 sm:px-4"
              >
                <div className="w-14 shrink-0">
                  <p className="text-base font-semibold text-foreground">
                    {session.time}
                  </p>
                  <p className="text-xs text-muted-foreground">{session.duration}</p>
                </div>
                <Avatar className="bg-secondary after:border-transparent">
                  <AvatarFallback className="bg-secondary text-xs font-semibold text-primary">
                    {session.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {session.childName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {session.guardianName}
                  </p>
                </div>
                <StatusBadge status={session.status} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Más acciones para ${session.childName}`}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
