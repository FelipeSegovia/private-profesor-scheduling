import type {
	UpdatePreferencesBody,
	WorkDayInput,
	WorkDayView,
} from "@/data/api-types";

function formatHour(hour: number): string {
	return `${String(hour).padStart(2, "0")}:00`;
}

function parseHour(time: string): number {
	return Number(time.slice(0, 2));
}

const FIRST_START_HOUR = 7;
const LAST_START_HOUR = 22;
const LAST_END_HOUR = 23;

export const START_HOURS = Array.from(
	{ length: LAST_START_HOUR - FIRST_START_HOUR + 1 },
	(_, i) => formatHour(FIRST_START_HOUR + i),
);

/** Horas de término posibles para un inicio: desde inicio + 1 h hasta las 23:00. */
export function endHoursFor(start: string): string[] {
	const from = parseHour(start) + 1;
	return Array.from({ length: LAST_END_HOUR - from + 1 }, (_, i) =>
		formatHour(from + i),
	);
}

/** Cupos de 1 hora entre `start` (incluido) y `end` (excluido). */
export function slotsInRange(start: string, end: string): number {
	return Math.max(0, parseHour(end) - parseHour(start));
}

export function toWorkDayInput(day: WorkDayView): WorkDayInput {
	return {
		weekday: day.weekday,
		available: day.available,
		start: day.start,
		end: day.end,
	};
}

/** Los 7 días tal como están hoy, con solo `edited` reemplazado (el PUT reemplaza la semana entera). */
export function buildWorkWeekPayload(
	workWeek: WorkDayView[],
	edited: WorkDayInput,
): WorkDayInput[] {
	return workWeek.map((day) =>
		day.weekday === edited.weekday ? edited : toWorkDayInput(day),
	);
}

/** El backend no valida esto: un rango vacío o invertido dejaría el día sin cupos en silencio. */
export function validateWorkDay(day: WorkDayInput): string | null {
	if (!day.available) return null;
	if (!day.start || !day.end) {
		return "Elige la hora de inicio y la de término.";
	}
	if (parseHour(day.end) <= parseHour(day.start)) {
		return "La hora de término debe ser posterior a la de inicio.";
	}
	return null;
}

export interface PreferencesIssue {
	code: "INVALID_RANGE" | "INVALID_PREFERENCES";
	message: string;
}

export const PREFERENCES_MESSAGES: Record<PreferencesIssue["code"], string> = {
	INVALID_PREFERENCES:
		"La antelación del correo de serie debe ser mayor que el plazo de confirmación.",
	INVALID_RANGE: "Revisa los valores de plazo y horizonte de reserva.",
};

/** Espejo de `validatePreferences` en `profesor-scheduling-api/src/domain/preferences.ts`. */
export function validatePreferences(
	input: UpdatePreferencesBody,
): PreferencesIssue | null {
	const { confirmationDeadlineHours, seriesNoticeHours, bookingHorizonWeeks } =
		input;
	let code: PreferencesIssue["code"] | null = null;
	if (
		!Number.isInteger(confirmationDeadlineHours) ||
		!Number.isInteger(seriesNoticeHours) ||
		!Number.isInteger(bookingHorizonWeeks) ||
		confirmationDeadlineHours < 1 ||
		bookingHorizonWeeks < 1 ||
		bookingHorizonWeeks > 52
	) {
		code = "INVALID_RANGE";
	} else if (seriesNoticeHours <= confirmationDeadlineHours) {
		code = "INVALID_PREFERENCES";
	}
	return code ? { code, message: PREFERENCES_MESSAGES[code] } : null;
}
