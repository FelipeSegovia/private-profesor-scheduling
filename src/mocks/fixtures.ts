import type {
	ActivityItem,
	EducatorProfile,
	PanelAgendaDay,
	PanelAgendaResponse,
	PanelChildDto,
	PanelGuardianDetail,
	PanelGuardianListItem,
	PanelPreferencesResponse,
	PanelSessionDto,
	PanelSummaryResponse,
	SessionStatus,
	SlotCell,
	SlotState,
	UpdatePreferencesBody,
	WorkDayInput,
	WorkDayView,
} from "@/data/api-types";
import { addDays, mondayOf, todayChileYmd } from "@/data/dashboard";

/**
 * Fixtures con la forma real de `/api/panel/*` (profesor-scheduling-api,
 * `.specs/004-panel-educadora/`), no la que inventaba el mock original.
 * Se generan en base a la fecha real (no una fecha demo fija), para que el
 * modo MSW ejercite el mismo código que el modo backend: navegación de
 * semanas, cupos pasados, bloqueos, etc.
 */

export const MSW_TOKEN = "msw-dev-token";

export const educatorFixture: EducatorProfile = {
	id: "educator-1",
	name: "Loreto Castillo",
	email: "educadora@example.com",
};

/**
 * Plantilla y plazos en memoria: `PUT /api/panel/template` y `PUT /api/panel/preferences`
 * los modifican, y la agenda, el resumen y `GET /preferences` los leen.
 * `0 = domingo` … `6 = sábado`, igual que el backend.
 */
const mockSchedule = {
	template: {
		0: [],
		1: ["19:00", "20:00"],
		2: ["19:00", "20:00"],
		3: ["19:00", "20:00"],
		4: ["19:00", "20:00"],
		5: ["19:00", "20:00"],
		6: ["09:00", "10:00", "11:00"],
	} as Record<number, string[]>,
	confirmationDeadlineHours: 24,
	seriesNoticeHours: 48,
	bookingHorizonWeeks: 8,
};

export function confirmationDeadlineHours(): number {
	return mockSchedule.confirmationDeadlineHours;
}

interface MockBooking {
	/** Desplazamiento desde el lunes de la semana consultada. */
	dayOffset: number;
	time: string;
	childId: string;
	guardianId: string;
	childName: string;
	guardianName: string;
	status: SessionStatus;
}

/** Mutable: `createSessionFixture` le agrega entradas para que la agenda refleje las citas creadas en modo mock. */
export const BOOKINGS: MockBooking[] = [
	{
		dayOffset: 0,
		time: "19:00",
		childId: "child-1",
		guardianId: "guardian-1",
		childName: "Mateo González",
		guardianName: "Camila González",
		status: "PENDING",
	},
	{
		dayOffset: 0,
		time: "20:00",
		childId: "child-2",
		guardianId: "guardian-2",
		childName: "Emilia Rojas",
		guardianName: "Francisca Rojas",
		status: "CONFIRMED",
	},
	{
		dayOffset: 1,
		time: "19:00",
		childId: "child-3",
		guardianId: "guardian-3",
		childName: "Sofía Muñoz",
		guardianName: "Andrea Muñoz",
		status: "CONFIRMED",
	},
	{
		dayOffset: 3,
		time: "19:00",
		childId: "child-4",
		guardianId: "guardian-4",
		childName: "Isidora Pérez",
		guardianName: "Carolina Pérez",
		status: "CONFIRMED",
	},
	{
		dayOffset: 3,
		time: "20:00",
		childId: "child-5",
		guardianId: "guardian-5",
		childName: "Benjamín Soto",
		guardianName: "Daniela Soto",
		status: "CONFIRMED",
	},
	{
		dayOffset: 4,
		time: "19:00",
		childId: "child-6",
		guardianId: "guardian-6",
		childName: "Amanda Flores",
		guardianName: "Javiera Flores",
		status: "PENDING",
	},
	{
		dayOffset: 5,
		time: "09:00",
		childId: "child-7",
		guardianId: "guardian-7",
		childName: "Tomás Vargas",
		guardianName: "Paula Vargas",
		status: "NOT_CONFIRMED",
	},
];

/** Miércoles bloqueado completo; viernes 20:00 bloqueado puntual. */
export const BLOCKED_DAY_OFFSET = 2;
export const BLOCKED_SLOT = { dayOffset: 4, time: "20:00" };

function weekdayOf(dateYmd: string): number {
	const [y, m, d] = dateYmd.split("-").map(Number);
	return new Date(y, m - 1, d).getDay();
}

/** Asume Chile en UTC-3 (sin horario de verano), suficiente para datos de prueba. */
function startsAtIso(dateYmd: string, time: string): string {
	return new Date(`${dateYmd}T${time}:00-03:00`).toISOString();
}

export function chileTimeFromIso(iso: string): string {
	return new Intl.DateTimeFormat("en-GB", {
		timeZone: "America/Santiago",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
	}).format(new Date(iso));
}

/** `dayOffset` del cupo dentro de su semana (0 = lunes), para ubicarlo en `BOOKINGS`. */
export function dayOffsetOf(dateYmd: string): number {
	const monday = mondayOf(dateYmd);
	for (let offset = 0; offset < 7; offset++) {
		if (addDays(monday, offset) === dateYmd) return offset;
	}
	return 0;
}

type BookedCell = SlotCell & { session: NonNullable<SlotCell["session"]> };

function isBooked(cell: SlotCell): cell is BookedCell {
	return Boolean(cell.session);
}

function toPanelSessionDto(cell: BookedCell): PanelSessionDto {
	const { session } = cell;
	return {
		id: session.id,
		date: cell.date,
		time: cell.time,
		childId: session.childId,
		guardianId: session.guardianId,
		childName: session.childName,
		guardianName: session.guardianName,
		status: session.status,
	};
}

function resolveState(input: {
	occupied: boolean;
	dayBlocked: boolean;
	slotBlocked: boolean;
	beyondHorizon: boolean;
}): SlotState {
	if (input.occupied) return "BOOKED";
	if (input.dayBlocked) return "BLOCKED_DAY";
	if (input.slotBlocked) return "BLOCKED_SLOT";
	if (input.beyondHorizon) return "BEYOND_HORIZON";
	return "FREE";
}

/** 7 días lunes→domingo, igual orden que `PanelAgendaResponse.days` real. */
export function buildWeekDays(weekStart: string): PanelAgendaDay[] {
	const horizonLimit = addDays(
		todayChileYmd(),
		mockSchedule.bookingHorizonWeeks * 7,
	);
	const now = Date.now();

	return Array.from({ length: 7 }, (_, offset) => {
		const date = addDays(weekStart, offset);
		const weekday = weekdayOf(date);
		const dayBlocked = offset === BLOCKED_DAY_OFFSET;
		// Como el backend, una sesión activa aparece aunque su hora ya no esté en la plantilla.
		const times = [
			...new Set([
				...(mockSchedule.template[weekday] ?? []),
				...BOOKINGS.filter(
					(b) =>
						b.dayOffset === offset &&
						(b.status === "PENDING" || b.status === "CONFIRMED"),
				).map((b) => b.time),
			]),
		].sort();

		const cells: SlotCell[] = times.map((time) => {
			const booking = BOOKINGS.find(
				(b) => b.dayOffset === offset && b.time === time,
			);
			const slotBlocked =
				offset === BLOCKED_SLOT.dayOffset && time === BLOCKED_SLOT.time;
			const startsAt = startsAtIso(date, time);
			const beyondHorizon = date > horizonLimit;
			const state = resolveState({
				occupied: Boolean(booking),
				dayBlocked,
				slotBlocked,
				beyondHorizon,
			});
			return {
				date,
				time,
				startsAt,
				past: new Date(startsAt).getTime() < now,
				state,
				dayBlocked,
				session: booking
					? {
							id: `${booking.childId}-${offset}-${time}`,
							status: booking.status,
							childId: booking.childId,
							guardianId: booking.guardianId,
							childName: booking.childName,
							guardianName: booking.guardianName,
						}
					: undefined,
			};
		});

		return { date, weekday, dayBlocked, cells };
	});
}

export function buildAgenda(weekStart: string): PanelAgendaResponse {
	return { weekStart, days: buildWeekDays(weekStart) };
}

export function buildSummary(dateYmd: string): PanelSummaryResponse {
	const weekStart = mondayOf(dateYmd);
	const days = buildWeekDays(weekStart);
	const allCells = days.flatMap((day) => day.cells);
	const now = Date.now();

	const todaySessions: PanelSessionDto[] = allCells
		.filter(isBooked)
		.filter((cell) => cell.date === dateYmd)
		.map(toPanelSessionDto);

	const attention: PanelSessionDto[] = allCells
		.filter(isBooked)
		.filter((cell) => {
			if (cell.session.status !== "PENDING") return false;
			const hoursUntil = (new Date(cell.startsAt).getTime() - now) / 3_600_000;
			return (
				hoursUntil >= 0 && hoursUntil <= mockSchedule.confirmationDeadlineHours
			);
		})
		.map(toPanelSessionDto);

	const booked = allCells.filter(isBooked);
	const confirmed = booked.filter(
		(cell) => cell.session.status === "CONFIRMED",
	);
	const pending = booked.filter((cell) => cell.session.status === "PENDING");
	const families = new Set(booked.map((cell) => cell.session.guardianId));

	const activity: ActivityItem[] = booked.slice(0, 5).map((cell, index) => ({
		id: `${cell.session.id}:created`,
		sessionId: cell.session.id,
		kind: "CREATED",
		childName: cell.session.childName,
		startsAt: cell.startsAt,
		actor: "GUARDIAN",
		at: new Date(now - (index + 1) * 3_600_000).toISOString(),
	}));

	const nextFreeCell = allCells.find(
		(cell) => cell.state === "FREE" && !cell.past,
	);

	return {
		today: dateYmd,
		weekStart,
		educator: educatorFixture,
		stats: {
			today: todaySessions.length,
			confirmed: confirmed.length,
			pending: pending.length,
			families: families.size,
		},
		todaySessions,
		attention,
		activity,
		nextFreeSlot: nextFreeCell ?? null,
	};
}

const WEEKDAY_LABELS = [
	"Domingo",
	"Lunes",
	"Martes",
	"Miércoles",
	"Jueves",
	"Viernes",
	"Sábado",
];

function hourOf(time: string): number {
	return Number(time.slice(0, 2));
}

function hourString(hour: number): string {
	return `${String(hour).padStart(2, "0")}:00`;
}

/** Igual que `workWeekFromTemplateRows` del backend: rango `[min, max + 1 h)` y `contiguous`. */
function workDayView(weekday: number, times: string[]): WorkDayView {
	const label = WEEKDAY_LABELS[weekday];
	if (times.length === 0) {
		return {
			weekday,
			label,
			available: false,
			start: null,
			end: null,
			times: [],
			contiguous: true,
		};
	}
	const hours = [...new Set(times.map(hourOf))].sort((x, y) => x - y);
	return {
		weekday,
		label,
		available: true,
		start: hourString(hours[0]),
		end: hourString(hours[hours.length - 1] + 1),
		times: [...times].sort(),
		contiguous: hours.every((h, i) => i === 0 || h === hours[i - 1] + 1),
	};
}

export function buildPreferences(): PanelPreferencesResponse {
	return {
		workWeek: Array.from({ length: 7 }, (_, weekday) =>
			workDayView(weekday, mockSchedule.template[weekday] ?? []),
		),
		confirmationDeadlineHours: mockSchedule.confirmationDeadlineHours,
		seriesNoticeHours: mockSchedule.seriesNoticeHours,
		bookingHorizonWeeks: mockSchedule.bookingHorizonWeeks,
	};
}

/**
 * Reemplaza la plantilla completa (como `PUT /api/panel/template`) y cuenta las reservas
 * activas de la semana actual, aún no pasadas, que quedaron fuera. Aproxima `orphanSessions`:
 * `BOOKINGS` se define por desplazamiento desde el lunes, no por fecha.
 */
export function replaceMockTemplate(workWeek: WorkDayInput[]): number {
	const template: Record<number, string[]> = {};
	for (let weekday = 0; weekday < 7; weekday++) template[weekday] = [];
	for (const day of workWeek) {
		if (!day.available || !day.start || !day.end) continue;
		for (let h = hourOf(day.start); h < hourOf(day.end); h++) {
			template[day.weekday].push(hourString(h));
		}
	}
	mockSchedule.template = template;

	const monday = mondayOf(todayChileYmd());
	const now = Date.now();
	return BOOKINGS.filter((b) => {
		if (b.status !== "PENDING" && b.status !== "CONFIRMED") return false;
		const date = addDays(monday, b.dayOffset);
		if (new Date(startsAtIso(date, b.time)).getTime() < now) return false;
		return !template[weekdayOf(date)].includes(b.time);
	}).length;
}

export function updateMockPreferences(body: UpdatePreferencesBody) {
	mockSchedule.confirmationDeadlineHours = body.confirmationDeadlineHours;
	mockSchedule.seriesNoticeHours = body.seriesNoticeHours;
	mockSchedule.bookingHorizonWeeks = body.bookingHorizonWeeks;
}

/**
 * Fichas de apoderado/niño para `GET /api/panel/guardians` y `/guardians/:id`.
 * Reutiliza los IDs de `BOOKINGS` (para que la ficha de un apoderado con cita
 * muestre `activeSessions` > 0) y agrega un par de apoderados sin sesiones
 * activas, uno de ellos sin niños, para probar esos casos en el diálogo de
 * crear cita.
 */
const GUARDIANS: PanelGuardianListItem[] = [
	{
		id: "guardian-1",
		name: "Camila González",
		email: "camila.gonzalez@example.com",
		phone: "+56912340001",
		childrenCount: 1,
		activeSessions: 1,
	},
	{
		id: "guardian-2",
		name: "Francisca Rojas",
		email: "francisca.rojas@example.com",
		phone: "+56912340002",
		childrenCount: 1,
		activeSessions: 1,
	},
	{
		id: "guardian-3",
		name: "Andrea Muñoz",
		email: "andrea.munoz@example.com",
		phone: "+56912340003",
		childrenCount: 1,
		activeSessions: 1,
	},
	{
		id: "guardian-4",
		name: "Carolina Pérez",
		email: "carolina.perez@example.com",
		phone: "+56912340004",
		childrenCount: 1,
		activeSessions: 1,
	},
	{
		id: "guardian-5",
		name: "Daniela Soto",
		email: "daniela.soto@example.com",
		phone: "+56912340005",
		childrenCount: 1,
		activeSessions: 1,
	},
	{
		id: "guardian-6",
		name: "Javiera Flores",
		email: "javiera.flores@example.com",
		phone: "+56912340006",
		childrenCount: 1,
		activeSessions: 1,
	},
	{
		id: "guardian-7",
		name: "Paula Vargas",
		email: "paula.vargas@example.com",
		phone: "+56912340007",
		childrenCount: 1,
		activeSessions: 1,
	},
	{
		id: "guardian-8",
		name: "Rodrigo Silva",
		email: "rodrigo.silva@example.com",
		phone: "+56912340008",
		childrenCount: 2,
		activeSessions: 0,
	},
	{
		id: "guardian-9",
		name: "Valentina Castro",
		email: "valentina.castro@example.com",
		phone: "+56912340009",
		childrenCount: 0,
		activeSessions: 0,
	},
];

const CHILDREN_BY_GUARDIAN: Record<string, PanelChildDto[]> = {
	"guardian-1": [
		{ id: "child-1", guardianId: "guardian-1", name: "Mateo González", age: 6 },
	],
	"guardian-2": [
		{ id: "child-2", guardianId: "guardian-2", name: "Emilia Rojas", age: 5 },
	],
	"guardian-3": [
		{ id: "child-3", guardianId: "guardian-3", name: "Sofía Muñoz", age: 8 },
	],
	"guardian-4": [
		{ id: "child-4", guardianId: "guardian-4", name: "Isidora Pérez", age: 7 },
	],
	"guardian-5": [
		{ id: "child-5", guardianId: "guardian-5", name: "Benjamín Soto", age: 9 },
	],
	"guardian-6": [
		{ id: "child-6", guardianId: "guardian-6", name: "Amanda Flores", age: 4 },
	],
	"guardian-7": [
		{ id: "child-7", guardianId: "guardian-7", name: "Tomás Vargas", age: 10 },
	],
	"guardian-8": [
		{ id: "child-8a", guardianId: "guardian-8", name: "Josefa Silva", age: 6 },
		{
			id: "child-8b",
			guardianId: "guardian-8",
			name: "Agustín Silva",
			age: 11,
		},
	],
	"guardian-9": [],
};

export function listGuardiansFixture(query?: string): PanelGuardianListItem[] {
	if (!query) return GUARDIANS;
	const needle = query.trim().toLowerCase();
	return GUARDIANS.filter((g) => g.name.toLowerCase().includes(needle));
}

export function getGuardianDetailFixture(
	id: string,
): PanelGuardianDetail | null {
	const guardian = GUARDIANS.find((g) => g.id === id);
	if (!guardian) return null;
	const { childrenCount, activeSessions, ...guardianDto } = guardian;
	return {
		guardian: guardianDto,
		children: CHILDREN_BY_GUARDIAN[id] ?? [],
		sessions: [],
	};
}

export function findChildFixture(
	childId: string,
): { child: PanelChildDto; guardian: PanelGuardianListItem } | null {
	for (const guardian of GUARDIANS) {
		const child = (CHILDREN_BY_GUARDIAN[guardian.id] ?? []).find(
			(c) => c.id === childId,
		);
		if (child) return { child, guardian };
	}
	return null;
}
