export type SessionStatus =
	| "pendiente"
	| "confirmada"
	| "no confirmada"
	| "cancelada";

export type ActivityKind =
	| "creacion"
	| "confirmacion"
	| "cancelacion"
	| "no_confirmada";

export interface Educator {
	firstName: string;
	fullName: string;
	role: string;
	initials: string;
}

export interface StatCard {
	id: string;
	label: string;
	value: string;
	hint: string;
	icon: "calendar" | "check" | "clock" | "users";
}

export interface WeekDay {
	date: string;
	dayLabel: string;
	dayNumber: number;
}

export interface Session {
	id: string;
	date: string;
	time: string;
	duration: string;
	childName: string;
	guardianName: string;
	initials: string;
	status: SessionStatus;
}

export interface AttentionItem {
	id: string;
	childName: string;
	/** Fecha de la sesión, para saltar a ella en `/agenda`. */
	date: string;
	detail: string;
	statusLabel: string;
}

export interface ActivityItem {
	id: string;
	kind: ActivityKind;
	title: string;
	meta: string;
	badge: string;
}

export interface AvailableSlot {
	date: string;
	time: string;
	startsAt: string;
	title: string;
	hint: string;
}

export interface Quote {
	text: string;
	attribution: string;
}

export interface SummaryResponse {
	educator: Educator;
	greetingDateLabel: string;
	today: string;
	weekStart: string;
	stats: StatCard[];
	/** `null` cuando no queda ningún cupo libre en la semana. */
	availableSlot: AvailableSlot | null;
	attentionItems: AttentionItem[];
	activities: ActivityItem[];
	quote: Quote;
}

const DAY_LABELS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"] as const;
const MONTH_NAMES = [
	"enero",
	"febrero",
	"marzo",
	"abril",
	"mayo",
	"junio",
	"julio",
	"agosto",
	"septiembre",
	"octubre",
	"noviembre",
	"diciembre",
] as const;
const WEEKDAY_LONG = [
	"Domingo",
	"Lunes",
	"Martes",
	"Miércoles",
	"Jueves",
	"Viernes",
	"Sábado",
] as const;

function parseLocalDate(iso: string): Date {
	const [y, m, d] = iso.split("-").map(Number);
	return new Date(y, m - 1, d);
}

function toIso(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

export function addDays(iso: string, days: number): string {
	const date = parseLocalDate(iso);
	date.setDate(date.getDate() + days);
	return toIso(date);
}

/**
 * Fecha de hoy en `America/Santiago` (no la del navegador): el backend
 * siempre piensa en calendario chileno. Solo se usa como respaldo antes de
 * que llegue `summary.today` del servidor (ver `AgendaPage`/`DashboardPage`).
 */
export function todayChileYmd(): string {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: "America/Santiago",
	}).format(new Date());
}

/** Fecha (`YYYY-MM-DD`) en `America/Santiago` de un instante ISO, no la del navegador. */
export function chileDateFromIso(iso: string): string {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: "America/Santiago",
	}).format(new Date(iso));
}

/** Lunes de la semana que contiene `iso`. `/api/panel/agenda` exige que `weekStart` sea lunes. */
export function mondayOf(iso: string): string {
	const date = parseLocalDate(iso);
	const weekday = date.getDay();
	const diff = weekday === 0 ? -6 : 1 - weekday;
	return addDays(iso, diff);
}

export function getWeekDays(weekStartIso: string): WeekDay[] {
	return Array.from({ length: 7 }, (_, i) => {
		const date = parseLocalDate(addDays(weekStartIso, i));
		return {
			date: toIso(date),
			dayLabel: DAY_LABELS[date.getDay()],
			dayNumber: date.getDate(),
		};
	});
}

export function formatMonthYear(weekStartIso: string): string {
	const date = parseLocalDate(weekStartIso);
	const month = MONTH_NAMES[date.getMonth()];
	return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${date.getFullYear()}`;
}

export function formatLongDate(iso: string): string {
	const date = parseLocalDate(iso);
	const weekday = WEEKDAY_LONG[date.getDay()];
	const month = MONTH_NAMES[date.getMonth()];
	return `${weekday}, ${date.getDate()} de ${month}`;
}
