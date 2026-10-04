import type {
	ChildNotesResponse,
	ClinicalNoteDto,
	CreateNoteBody,
	CreateSessionBody,
	EducatorProfile,
	PanelAgendaResponse,
	PanelAuthResult,
	PanelGuardianDetail,
	PanelGuardianListItem,
	PanelNotificationsResponse,
	PanelPreferencesResponse,
	PanelSessionDto,
	PanelSummaryResponse,
	UpdateNoteBody,
	UpdatePreferencesBody,
	UpdateTemplateBody,
	UpdateTemplateResult,
} from "@/data/api-types";
import { del, get, getBlob, patch, post, put } from "@/lib/api/client";

export function panelLogin(
	email: string,
	password: string,
): Promise<PanelAuthResult> {
	return post("/api/panel/auth/login", { email, password });
}

export async function panelMe(): Promise<EducatorProfile> {
	const data = await get<{ educator: EducatorProfile }>("/api/panel/auth/me");
	return data.educator;
}

export function panelLogout(): Promise<void> {
	return post("/api/panel/auth/logout");
}

export function fetchSummary(date?: string): Promise<PanelSummaryResponse> {
	const query = date ? `?date=${encodeURIComponent(date)}` : "";
	return get(`/api/panel/summary${query}`);
}

/** `weekStart` tiene que ser un lunes (`YYYY-MM-DD`); el backend responde 400 si no. */
export function fetchAgenda(weekStart: string): Promise<PanelAgendaResponse> {
	return get(`/api/panel/agenda?weekStart=${encodeURIComponent(weekStart)}`);
}

export function fetchPreferences(): Promise<PanelPreferencesResponse> {
	return get("/api/panel/preferences");
}

export function updatePreferences(
	body: UpdatePreferencesBody,
): Promise<PanelPreferencesResponse> {
	return put("/api/panel/preferences", body);
}

/** Reemplaza la plantilla completa: hay que mandar los 7 días. */
export function updateTemplate(
	body: UpdateTemplateBody,
): Promise<UpdateTemplateResult> {
	return put("/api/panel/template", body);
}

export function listGuardians(
	query?: string,
): Promise<{ guardians: PanelGuardianListItem[] }> {
	const q = query ? `?query=${encodeURIComponent(query)}` : "";
	return get(`/api/panel/guardians${q}`);
}

export function getGuardian(id: string): Promise<PanelGuardianDetail> {
	return get(`/api/panel/guardians/${id}`);
}

export function createSession(
	body: CreateSessionBody,
): Promise<PanelSessionDto> {
	return post("/api/panel/sessions", body);
}

export function fetchNotifications(): Promise<PanelNotificationsResponse> {
	return get("/api/panel/notifications");
}

export function markNotificationsSeen(): Promise<void> {
	return post("/api/panel/notifications/seen");
}

/** Registros de la ficha clínica de un niño, con el niño y su apoderado. */
export function listChildNotes(childId: string): Promise<ChildNotesResponse> {
	return get(`/api/panel/children/${childId}/notes`);
}

export function createChildNote(
	childId: string,
	body: CreateNoteBody,
): Promise<ClinicalNoteDto> {
	return post(`/api/panel/children/${childId}/notes`, body);
}

export function updateNote(
	id: string,
	body: UpdateNoteBody,
): Promise<ClinicalNoteDto> {
	return patch(`/api/panel/notes/${id}`, body);
}

export function deleteNote(id: string): Promise<void> {
	return del(`/api/panel/notes/${id}`);
}

/** PDF con el historial completo (más antiguo primero). */
export function fetchChildNotesPdf(
	childId: string,
): Promise<{ blob: Blob; filename: string | null }> {
	return getBlob(`/api/panel/children/${childId}/notes.pdf`);
}
