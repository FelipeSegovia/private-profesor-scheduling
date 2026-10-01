/**
 * Formas exactas del contrato `/api/panel/*` (profesor-scheduling-api,
 * `.specs/004-panel-educadora/`, completada). Copiadas a mano desde
 * `src/panel/`, `src/slots/slot-grid.ts` y `src/domain/` de ese repo —
 * `openapi.json` no sirve para generar tipos (`components.schemas` vacío,
 * el backend usa `interface` + Zod, no clases DTO).
 *
 * Trampas a tener presentes en cualquier código que use estos tipos:
 * - `status` viaja en inglés (enum crudo de Prisma), no el literal español
 *   del contrato congelado del apoderado.
 * - Los campos opcionales (`helpRequest`, `seriesId`, `session`) están
 *   `undefined` cuando no aplican — quedan ausentes del JSON, no `null`.
 *   `WorkDayView.start`/`end` en cambio sí son `null` explícito.
 * - `weekday` es `0 = domingo` en todas partes, pero `PanelAgendaResponse.days`
 *   viene ordenado lun→dom y `PanelPreferencesResponse.workWeek` dom→sáb.
 */

export type SessionStatus =
	| "PENDING"
	| "CONFIRMED"
	| "NOT_CONFIRMED"
	| "CANCELLED";

export type Actor = "GUARDIAN" | "EDUCATOR" | "SYSTEM";

export interface PanelSessionDto {
	id: string;
	date: string;
	time: string;
	childId: string;
	guardianId: string;
	childName: string;
	guardianName: string;
	status: SessionStatus;
	helpRequest?: string;
	seriesId?: string;
}

export type SlotState =
	| "FREE"
	| "BOOKED"
	| "BLOCKED_DAY"
	| "BLOCKED_SLOT"
	| "BEYOND_HORIZON";

export interface SlotCellSession {
	id: string;
	status: SessionStatus;
	childId: string;
	guardianId: string;
	childName: string;
	guardianName: string;
	helpRequest?: string;
	seriesId?: string;
}

export interface SlotCell {
	date: string;
	time: string;
	startsAt: string;
	past: boolean;
	state: SlotState;
	dayBlocked: boolean;
	session?: SlotCellSession;
}

export interface PanelAgendaDay {
	date: string;
	weekday: number;
	dayBlocked: boolean;
	cells: SlotCell[];
}

export interface PanelAgendaResponse {
	weekStart: string;
	days: PanelAgendaDay[];
}

export type ActivityKind =
	| "CREATED"
	| "CONFIRMED"
	| "CANCELLED"
	| "NOT_CONFIRMED";

export interface ActivityItem {
	id: string;
	sessionId: string;
	kind: ActivityKind;
	childName: string;
	/** ISO. Inicio de la cita afectada (no el momento del cambio, que es `at`). */
	startsAt: string;
	actor: Actor;
	at: string;
}

/** Cambio de sesión que llega por `GET /api/panel/events` (SSE). */
export type SessionEventKind = ActivityKind | "MOVED";

export interface SessionEvent {
	/** `${sessionId}:${kind}`. No es único en el tiempo (`MOVED` se repite). */
	id: string;
	kind: SessionEventKind;
	sessionId: string;
	childName: string;
	startsAt: string;
	actor: Actor;
	at: string;
}

export type NotificationItem = ActivityItem & { unread: boolean };

export interface PanelNotificationsResponse {
	items: NotificationItem[];
	/** No leídas en toda la ventana, no solo en `items`. */
	unreadCount: number;
}

export interface PanelStats {
	today: number;
	confirmed: number;
	pending: number;
	families: number;
}

export interface PanelSummaryResponse {
	today: string;
	weekStart: string;
	educator: { id: string; name: string; email: string };
	stats: PanelStats;
	todaySessions: PanelSessionDto[];
	attention: PanelSessionDto[];
	activity: ActivityItem[];
	nextFreeSlot: SlotCell | null;
}

export interface WorkDayView {
	weekday: number;
	label: string;
	available: boolean;
	start: string | null;
	end: string | null;
	times: string[];
	contiguous: boolean;
}

export interface PanelPreferencesResponse {
	workWeek: WorkDayView[];
	confirmationDeadlineHours: number;
	seriesNoticeHours: number;
	bookingHorizonWeeks: number;
}

export interface EducatorProfile {
	id: string;
	name: string;
	email: string;
}

export interface PanelAuthResult {
	token: string;
	educator: EducatorProfile;
}

export interface PanelGuardianListItem {
	id: string;
	name: string;
	email: string;
	phone: string;
	childrenCount: number;
	activeSessions: number;
}

export interface PanelChildDto {
	id: string;
	guardianId: string;
	name: string;
	age: number;
}

export interface PanelGuardianDto {
	id: string;
	name: string;
	email: string;
	phone: string;
}

export interface PanelGuardianDetail {
	guardian: PanelGuardianDto;
	children: PanelChildDto[];
	sessions: PanelSessionDto[];
}

export interface CreateSessionBody {
	childId: string;
	startsAt: string;
	helpRequest?: string;
}

export interface WorkDayInput {
	weekday: number;
	available: boolean;
	start: string | null;
	end: string | null;
}

export interface UpdateTemplateBody {
	workWeek: WorkDayInput[];
}

export interface UpdateTemplateResult {
	workWeek: WorkDayView[];
	/** Sesiones activas futuras que quedaron fuera de la plantilla nueva (no se tocan). */
	orphanSessions: number;
}

export interface UpdatePreferencesBody {
	confirmationDeadlineHours: number;
	seriesNoticeHours: number;
	bookingHorizonWeeks: number;
}
