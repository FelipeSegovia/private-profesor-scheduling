import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  addDays,
  formatLongDate,
  formatMonthYear,
  getWeekDays,
  sessionsForDate,
  type ActivityItem,
  type SummaryResponse,
} from '@/data/dashboard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AgendaCard } from './AgendaCard'
import { AttentionCard } from './AttentionCard'
import { QuickAccessCard } from './QuickAccessCard'
import { RecentActivity, type ActivityFilter } from './RecentActivity'
import { SlotAndHours } from './SlotAndHours'
import { StatCards } from './StatCards'

function filterActivities(items: ActivityItem[], filter: ActivityFilter) {
  if (filter === 'reservas') {
    return items.filter((item) => item.kind === 'nueva_reserva')
  }
  if (filter === 'cambios') {
    return items.filter((item) => item.kind === 'confirmacion')
  }
  return items
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Skeleton className="h-96 rounded-2xl" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading')
  const [weekStart, setWeekStart] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('todas')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch('/api/summary')
        if (!response.ok) {
          throw new Error('No se pudo cargar el resumen')
        }
        const data = (await response.json()) as SummaryResponse
        if (cancelled) return
        setSummary(data)
        setWeekStart(data.demoWeekStart)
        setSelectedDate(data.demoToday)
        setStatus('ready')
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const weekDays = useMemo(
    () => (weekStart ? getWeekDays(weekStart) : []),
    [weekStart],
  )
  const daySessions = useMemo(
    () =>
      summary && selectedDate
        ? sessionsForDate(summary.sessions, selectedDate)
        : [],
    [summary, selectedDate],
  )
  const filteredActivities = useMemo(
    () =>
      summary ? filterActivities(summary.activities, activityFilter) : [],
    [summary, activityFilter],
  )

  if (status === 'loading') {
    return <DashboardSkeleton />
  }

  if (status === 'error' || !summary) {
    return (
      <div className="mx-auto max-w-6xl rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <p className="font-semibold text-foreground">No se pudo cargar el resumen</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Revisa la conexión o recarga la página.
        </p>
        <Button
          type="button"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">
            {summary.greetingDateLabel}
          </p>
          <h1 className="mt-1 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Buenos días, {summary.educator.firstName}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
            Aquí tienes un resumen de lo que ocurre hoy.
          </p>
        </div>
        <Button type="button" className="shrink-0 rounded-xl">
          <Plus className="size-4" strokeWidth={2.5} />
          Nueva cita
        </Button>
      </div>

      <StatCards items={summary.stats} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-5">
        <AgendaCard
          monthLabel={formatMonthYear(weekStart)}
          weekDays={weekDays}
          selectedDate={selectedDate}
          dayTitle={formatLongDate(selectedDate)}
          sessions={daySessions}
          onSelectDate={setSelectedDate}
          onPrevWeek={() => {
            const nextStart = addDays(weekStart, -7)
            setWeekStart(nextStart)
            setSelectedDate(nextStart)
          }}
          onNextWeek={() => {
            const nextStart = addDays(weekStart, 7)
            setWeekStart(nextStart)
            setSelectedDate(nextStart)
          }}
        />
        <div className="flex flex-col gap-4">
          <AttentionCard items={summary.attentionItems} />
          <QuickAccessCard />
        </div>
      </div>

      <SlotAndHours slot={summary.availableSlot} quote={summary.quote} />

      <RecentActivity
        items={filteredActivities}
        filter={activityFilter}
        onFilterChange={setActivityFilter}
      />
    </div>
  )
}
