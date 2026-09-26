export type SessionStatus = 'pendiente' | 'confirmada'

export type ActivityKind = 'confirmacion' | 'nueva_reserva'

export interface Educator {
  firstName: string
  fullName: string
  role: string
  initials: string
}

export interface StatCard {
  id: string
  label: string
  value: string
  hint: string
  icon: 'calendar' | 'check' | 'clock' | 'users'
}

export interface WeekDay {
  date: string
  dayLabel: string
  dayNumber: number
}

export interface Session {
  id: string
  date: string
  time: string
  duration: string
  childName: string
  guardianName: string
  initials: string
  status: SessionStatus
}

export interface AttentionItem {
  id: string
  childName: string
  detail: string
  statusLabel: string
}

export interface ActivityItem {
  id: string
  kind: ActivityKind
  title: string
  meta: string
  badge: string
}

export interface AvailableSlot {
  date: string
  time: string
  title: string
  hint: string
}

export interface Quote {
  text: string
  attribution: string
}

export interface SummaryResponse {
  educator: Educator
  greetingDateLabel: string
  demoToday: string
  demoWeekStart: string
  stats: StatCard[]
  sessions: Session[]
  availableSlot: AvailableSlot
  attentionItems: AttentionItem[]
  activities: ActivityItem[]
  quote: Quote
}

export const DEMO_TODAY = '2026-09-26'
export const demoWeekStart = '2026-09-21'

const DAY_LABELS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'] as const
const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const
const WEEKDAY_LONG = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toIso(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(iso: string, days: number): string {
  const date = parseLocalDate(iso)
  date.setDate(date.getDate() + days)
  return toIso(date)
}

export function getWeekDays(weekStartIso: string): WeekDay[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = parseLocalDate(addDays(weekStartIso, i))
    return {
      date: toIso(date),
      dayLabel: DAY_LABELS[date.getDay()],
      dayNumber: date.getDate(),
    }
  })
}

export function formatMonthYear(weekStartIso: string): string {
  const date = parseLocalDate(weekStartIso)
  const month = MONTH_NAMES[date.getMonth()]
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${date.getFullYear()}`
}

export function formatLongDate(iso: string): string {
  const date = parseLocalDate(iso)
  const weekday = WEEKDAY_LONG[date.getDay()]
  const month = MONTH_NAMES[date.getMonth()]
  return `${weekday}, ${date.getDate()} de ${month}`
}

export function sessionsForDate(
  sessions: Session[],
  dateIso: string,
): Session[] {
  return sessions.filter((s) => s.date === dateIso)
}
