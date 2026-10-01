import { delay, HttpResponse, http } from "msw";
import type {
	NotificationItem,
	PanelNotificationsResponse,
	SessionEvent,
} from "@/data/api-types";
import { addDays, todayChileYmd } from "@/data/dashboard";
import { apiUrl } from "@/lib/env";
import { buildSummary } from "./fixtures";
import { noSessionResponse, requireAuth } from "./http";

// Avisos en tiempo real simulados (spec 005): la campana y el stream SSE, con
// estado en memoria. Mismas reglas que el backend: la campana no incluye lo
// que hizo la educadora, "no leído" = posterior a `seenAt` (todo si es nulo),
// máximo 20 ítems y `unreadCount` sobre toda la lista.

const NOTIFICATIONS_LIMIT = 20;
const PING_INTERVAL_MS = 25_000;
const encoder = new TextEncoder();

type ListItem = Omit<NotificationItem, "unread">;

/** Semilla: la actividad del resumen mock, sin lo que hizo la educadora. */
const items: ListItem[] = buildSummary(todayChileYmd()).activity.filter(
	(item) => item.actor !== "EDUCATOR",
);
let seenAt: number | null = null;
const streams = new Set<ReadableStreamDefaultController<Uint8Array>>();

function listNotifications(): PanelNotificationsResponse {
	const all: NotificationItem[] = [...items]
		.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
		.map((item) => ({
			...item,
			unread: seenAt === null || Date.parse(item.at) > seenAt,
		}));
	return {
		items: all.slice(0, NOTIFICATIONS_LIMIT),
		unreadCount: all.filter((item) => item.unread).length,
	};
}

function writeToStream(
	controller: ReadableStreamDefaultController<Uint8Array>,
	text: string,
) {
	try {
		controller.enqueue(encoder.encode(text));
	} catch {
		// Stream ya cerrado por el cliente: `cleanup` lo saca del conjunto.
		streams.delete(controller);
	}
}

/**
 * Simula un cambio de sesión: lo empuja por todos los streams abiertos y, si
 * lo hizo un apoderado o el sistema, lo suma a la campana. Todo lo omitido se
 * completa con valores de prueba (reserva nueva de mañana a las 19:00).
 */
export function emitMockEvent(partial: Partial<SessionEvent> = {}) {
	const kind = partial.kind ?? "CREATED";
	const sessionId =
		partial.sessionId ?? `mock-${Math.random().toString(36).slice(2, 8)}`;
	const event: SessionEvent = {
		id: partial.id ?? `${sessionId}:${kind}`,
		kind,
		sessionId,
		childName: partial.childName ?? "Niño de prueba",
		startsAt:
			partial.startsAt ??
			new Date(`${addDays(todayChileYmd(), 1)}T19:00:00-03:00`).toISOString(),
		actor: partial.actor ?? "GUARDIAN",
		at: partial.at ?? new Date().toISOString(),
	};

	if (event.actor !== "EDUCATOR" && event.kind !== "MOVED") {
		items.unshift({
			// Igual que el backend: el alta usa `:created`, el cambio de estado `:KIND`.
			id:
				event.kind === "CREATED"
					? `${sessionId}:created`
					: `${sessionId}:${event.kind}`,
			sessionId,
			kind: event.kind,
			childName: event.childName,
			startsAt: event.startsAt,
			actor: event.actor,
			at: event.at,
		});
	}

	const frame = `event: session\nid: ${event.id}\ndata: ${JSON.stringify(event)}\n\n`;
	for (const controller of streams) writeToStream(controller, frame);
	return event;
}

declare global {
	interface Window {
		/** Solo existe con MSW activo (nunca en un build de producción). */
		__panelMock?: { emit: typeof emitMockEvent };
	}
}

window.__panelMock = { emit: emitMockEvent };
console.info(
	"[MSW] Avisos simulados: __panelMock.emit({ kind: 'CREATED' | 'CONFIRMED' | 'CANCELLED' | 'NOT_CONFIRMED' | 'MOVED', actor?, childName? })",
);

export const notificationHandlers = [
	http.get(apiUrl("/api/panel/notifications"), async ({ request }) => {
		await delay(150);
		if (!requireAuth(request)) return noSessionResponse();
		return HttpResponse.json(listNotifications());
	}),

	http.post(apiUrl("/api/panel/notifications/seen"), async ({ request }) => {
		await delay(100);
		if (!requireAuth(request)) return noSessionResponse();
		seenAt = Date.now();
		return new HttpResponse(null, { status: 204 });
	}),

	http.get(apiUrl("/api/panel/events"), ({ request }) => {
		if (!requireAuth(request)) return noSessionResponse();

		let cleanup = () => {};
		const stream = new ReadableStream<Uint8Array>({
			start(controller) {
				streams.add(controller);
				writeToStream(controller, ": conectado\n\n");
				const ping = setInterval(
					() => writeToStream(controller, "event: ping\ndata: {}\n\n"),
					PING_INTERVAL_MS,
				);
				cleanup = () => {
					clearInterval(ping);
					streams.delete(controller);
					request.signal.removeEventListener("abort", cleanup);
					try {
						controller.close();
					} catch {
						// ya cerrado
					}
				};
				request.signal.addEventListener("abort", cleanup);
			},
			cancel() {
				cleanup();
			},
		});

		return new HttpResponse(stream, {
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
			},
		});
	}),
];
