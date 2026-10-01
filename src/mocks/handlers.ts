import { delay, HttpResponse, http } from "msw";
import type {
	CreateSessionBody,
	PanelSessionDto,
	UpdatePreferencesBody,
	UpdateTemplateBody,
} from "@/data/api-types";
import { chileDateFromIso, todayChileYmd } from "@/data/dashboard";
import { validatePreferences } from "@/data/preferences";
import { apiUrl } from "@/lib/env";
import {
	BLOCKED_DAY_OFFSET,
	BLOCKED_SLOT,
	BOOKINGS,
	buildAgenda,
	buildPreferences,
	buildSummary,
	chileTimeFromIso,
	confirmationDeadlineHours,
	dayOffsetOf,
	educatorFixture,
	findChildFixture,
	getGuardianDetailFixture,
	listGuardiansFixture,
	MSW_TOKEN,
	replaceMockTemplate,
	updateMockPreferences,
} from "./fixtures";
import { errorResponse, requireAuth } from "./http";
import { notificationHandlers } from "./notifications";

/** `weekStart` tiene que ser `YYYY-MM-DD` y lunes, igual validación que el backend real. */
function isMonday(dateYmd: string): boolean {
	const [y, m, d] = dateYmd.split("-").map(Number);
	return new Date(y, m - 1, d).getDay() === 1;
}

export const mockHandlers = [
	http.post(apiUrl("/api/panel/auth/login"), async ({ request }) => {
		await delay(200);
		const body = (await request.json()) as {
			email?: string;
			password?: string;
		};
		if (!body.email || !body.password) {
			return errorResponse(
				400,
				"Completa todos los campos obligatorios.",
				"MISSING_FIELDS",
			);
		}
		return HttpResponse.json({ token: MSW_TOKEN, educator: educatorFixture });
	}),

	http.get(apiUrl("/api/panel/auth/me"), async ({ request }) => {
		await delay(100);
		if (!requireAuth(request)) {
			return errorResponse(
				401,
				"Tu sesión expiró. Inicia sesión de nuevo.",
				"NO_SESSION",
			);
		}
		return HttpResponse.json({ educator: educatorFixture });
	}),

	http.post(
		apiUrl("/api/panel/auth/logout"),
		() => new HttpResponse(null, { status: 204 }),
	),

	http.get(apiUrl("/api/panel/summary"), async ({ request }) => {
		await delay(250);
		if (!requireAuth(request)) {
			return errorResponse(
				401,
				"Tu sesión expiró. Inicia sesión de nuevo.",
				"NO_SESSION",
			);
		}
		const url = new URL(request.url);
		const date = url.searchParams.get("date") ?? todayChileYmd();
		return HttpResponse.json(buildSummary(date));
	}),

	http.get(apiUrl("/api/panel/agenda"), async ({ request }) => {
		await delay(250);
		if (!requireAuth(request)) {
			return errorResponse(
				401,
				"Tu sesión expiró. Inicia sesión de nuevo.",
				"NO_SESSION",
			);
		}
		const url = new URL(request.url);
		const weekStart = url.searchParams.get("weekStart");
		if (!weekStart) {
			return errorResponse(
				400,
				"weekStart es obligatorio.",
				"VALIDATION_ERROR",
			);
		}
		if (!isMonday(weekStart)) {
			return errorResponse(
				400,
				"weekStart debe ser un lunes",
				"VALIDATION_ERROR",
			);
		}
		return HttpResponse.json(buildAgenda(weekStart));
	}),

	http.get(apiUrl("/api/panel/preferences"), async ({ request }) => {
		await delay(200);
		if (!requireAuth(request)) {
			return errorResponse(
				401,
				"Tu sesión expiró. Inicia sesión de nuevo.",
				"NO_SESSION",
			);
		}
		return HttpResponse.json(buildPreferences());
	}),

	http.put(apiUrl("/api/panel/preferences"), async ({ request }) => {
		await delay(200);
		if (!requireAuth(request)) {
			return errorResponse(
				401,
				"Tu sesión expiró. Inicia sesión de nuevo.",
				"NO_SESSION",
			);
		}
		const body = (await request.json()) as UpdatePreferencesBody;
		const issue = validatePreferences(body);
		if (issue) return errorResponse(400, issue.message, issue.code);
		updateMockPreferences(body);
		return HttpResponse.json(buildPreferences());
	}),

	http.put(apiUrl("/api/panel/template"), async ({ request }) => {
		await delay(200);
		if (!requireAuth(request)) {
			return errorResponse(
				401,
				"Tu sesión expiró. Inicia sesión de nuevo.",
				"NO_SESSION",
			);
		}
		const body = (await request.json()) as UpdateTemplateBody;
		const orphanSessions = replaceMockTemplate(body.workWeek ?? []);
		return HttpResponse.json({
			workWeek: buildPreferences().workWeek,
			orphanSessions,
		});
	}),

	http.get(apiUrl("/api/panel/guardians"), async ({ request }) => {
		await delay(200);
		if (!requireAuth(request)) {
			return errorResponse(
				401,
				"Tu sesión expiró. Inicia sesión de nuevo.",
				"NO_SESSION",
			);
		}
		const url = new URL(request.url);
		const query = url.searchParams.get("query") ?? undefined;
		return HttpResponse.json({ guardians: listGuardiansFixture(query) });
	}),

	http.get(apiUrl("/api/panel/guardians/:id"), async ({ request, params }) => {
		await delay(200);
		if (!requireAuth(request)) {
			return errorResponse(
				401,
				"Tu sesión expiró. Inicia sesión de nuevo.",
				"NO_SESSION",
			);
		}
		const detail = getGuardianDetailFixture(params.id as string);
		if (!detail) {
			return errorResponse(
				404,
				"No se encontró el apoderado.",
				"GUARDIAN_NOT_FOUND",
			);
		}
		return HttpResponse.json(detail);
	}),

	http.post(apiUrl("/api/panel/sessions"), async ({ request }) => {
		await delay(250);
		if (!requireAuth(request)) {
			return errorResponse(
				401,
				"Tu sesión expiró. Inicia sesión de nuevo.",
				"NO_SESSION",
			);
		}
		const body = (await request.json()) as CreateSessionBody;
		const found = findChildFixture(body.childId);
		if (!found) {
			return errorResponse(404, "No se encontró el niño.", "CHILD_NOT_FOUND");
		}
		const startsAtMs = new Date(body.startsAt).getTime();
		if (startsAtMs < Date.now()) {
			return errorResponse(400, "Ese cupo ya pasó.", "PAST_SLOT");
		}
		const date = chileDateFromIso(body.startsAt);
		const time = chileTimeFromIso(body.startsAt);
		const dayOffset = dayOffsetOf(date);
		const slotBlocked =
			dayOffset === BLOCKED_DAY_OFFSET ||
			(dayOffset === BLOCKED_SLOT.dayOffset && time === BLOCKED_SLOT.time);
		if (slotBlocked) {
			return errorResponse(409, "Ese cupo está bloqueado.", "SLOT_BLOCKED");
		}
		const taken = BOOKINGS.some(
			(b) => b.dayOffset === dayOffset && b.time === time,
		);
		if (taken) {
			return errorResponse(
				409,
				"Ese cupo ya fue tomado por otra sesión.",
				"SLOT_TAKEN",
			);
		}

		const hoursUntil = (startsAtMs - Date.now()) / 3_600_000;
		const status =
			hoursUntil <= confirmationDeadlineHours() ? "CONFIRMED" : "PENDING";
		BOOKINGS.push({
			dayOffset,
			time,
			childId: found.child.id,
			guardianId: found.guardian.id,
			childName: found.child.name,
			guardianName: found.guardian.name,
			status,
		});

		const session: PanelSessionDto = {
			id: `${found.child.id}-${dayOffset}-${time}`,
			date,
			time,
			childId: found.child.id,
			guardianId: found.guardian.id,
			childName: found.child.name,
			guardianName: found.guardian.name,
			status,
			helpRequest: body.helpRequest,
		};
		return HttpResponse.json(session, { status: 201 });
	}),
	...notificationHandlers,
];
