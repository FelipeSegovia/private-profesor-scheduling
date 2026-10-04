import { delay, HttpResponse, http } from "msw";
import type {
	CreateNoteBody,
	CreateSessionBody,
	PanelSessionDto,
	UpdateNoteBody,
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
	createNoteFixture,
	dayOffsetOf,
	deleteNoteFixture,
	educatorFixture,
	findChildFixture,
	getGuardianDetailFixture,
	listGuardiansFixture,
	listNotesFixture,
	MSW_TOKEN,
	type NoteFixtureError,
	replaceMockTemplate,
	updateMockPreferences,
	updateNoteFixture,
} from "./fixtures";
import { errorResponse, noSessionResponse, requireAuth } from "./http";
import { notificationHandlers } from "./notifications";

/** `weekStart` tiene que ser `YYYY-MM-DD` y lunes, igual validación que el backend real. */
function isMonday(dateYmd: string): boolean {
	const [y, m, d] = dateYmd.split("-").map(Number);
	return new Date(y, m - 1, d).getDay() === 1;
}

/** PDF mínimo pero válido: el mock no genera el historial real, solo prueba la descarga. */
function mockPdf(title: string): Uint8Array {
	const text = title.replace(/[()\\]/g, "");
	const stream = `BT /F1 14 Tf 30 60 Td (${text}) Tj ET`;
	const pdf = [
		"%PDF-1.1",
		"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj",
		"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj",
		"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 360 120]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj",
		`4 0 obj<</Length ${stream.length}>>stream\n${stream}\nendstream endobj`,
		"5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj",
		"trailer<</Root 1 0 R>>",
		"%%EOF",
	].join("\n");
	return new TextEncoder().encode(pdf);
}

function noteErrorResponse(error: NoteFixtureError) {
	switch (error.code) {
		case "CHILD_NOT_FOUND":
			return errorResponse(404, "Niño no encontrado.", "CHILD_NOT_FOUND");
		case "NOTE_NOT_FOUND":
			return errorResponse(404, "Registro no encontrado.", "NOTE_NOT_FOUND");
		case "NOTE_SESSION_MISMATCH":
			return errorResponse(
				422,
				"La sesión elegida no es de este niño.",
				"NOTE_SESSION_MISMATCH",
			);
		case "VALIDATION_ERROR":
			return errorResponse(400, error.message, "VALIDATION_ERROR");
	}
}

function isNoteError(value: unknown): value is NoteFixtureError {
	return typeof value === "object" && value !== null && "code" in value;
}

const clinicalNoteHandlers = [
	// `notes.pdf` antes que `notes`: son rutas distintas, pero así no depende del matcher.
	http.get(
		apiUrl("/api/panel/children/:id/notes.pdf"),
		async ({ request, params }) => {
			await delay(300);
			if (!requireAuth(request)) return noSessionResponse();
			const data = listNotesFixture(params.id as string);
			if (!data) return noteErrorResponse({ code: "CHILD_NOT_FOUND" });
			const slug = data.child.name
				.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "")
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-+|-+$/g, "");
			return new HttpResponse(mockPdf(`Ficha de ${data.child.name} (MSW)`), {
				headers: {
					"Content-Type": "application/pdf",
					"Content-Disposition": `attachment; filename="ficha-${slug}-${todayChileYmd()}.pdf"`,
				},
			});
		},
	),

	http.get(
		apiUrl("/api/panel/children/:id/notes"),
		async ({ request, params }) => {
			await delay(200);
			if (!requireAuth(request)) return noSessionResponse();
			const data = listNotesFixture(params.id as string);
			if (!data) return noteErrorResponse({ code: "CHILD_NOT_FOUND" });
			return HttpResponse.json(data);
		},
	),

	http.post(
		apiUrl("/api/panel/children/:id/notes"),
		async ({ request, params }) => {
			await delay(250);
			if (!requireAuth(request)) return noSessionResponse();
			const body = (await request.json()) as Partial<CreateNoteBody>;
			const result = createNoteFixture(params.id as string, body);
			if (isNoteError(result)) return noteErrorResponse(result);
			return HttpResponse.json(result, { status: 201 });
		},
	),

	http.patch(apiUrl("/api/panel/notes/:id"), async ({ request, params }) => {
		await delay(250);
		if (!requireAuth(request)) return noSessionResponse();
		const body = (await request.json()) as UpdateNoteBody;
		const result = updateNoteFixture(params.id as string, body);
		if (isNoteError(result)) return noteErrorResponse(result);
		return HttpResponse.json(result);
	}),

	http.delete(apiUrl("/api/panel/notes/:id"), async ({ request, params }) => {
		await delay(200);
		if (!requireAuth(request)) return noSessionResponse();
		if (!deleteNoteFixture(params.id as string)) {
			return noteErrorResponse({ code: "NOTE_NOT_FOUND" });
		}
		return new HttpResponse(null, { status: 204 });
	}),
];

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
	...clinicalNoteHandlers,
	...notificationHandlers,
];
