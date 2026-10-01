import type { NotificationItem, SessionEvent } from "@/data/api-types";
import type { ActivityKind } from "@/data/dashboard";
import { notificationMessage, relativeTime } from "@/data/notification-text";
import { ACTIVITY_META } from "./summary";

/** Un aviso de la campana, listo para pintar. */
export interface NotificationView {
	id: string;
	sessionId: string;
	/** Tipo visual (ícono), el mismo criterio que la actividad del resumen. */
	kind: ActivityKind;
	text: string;
	relative: string;
	unread: boolean;
	/** ISO. Inicio de la cita, para ubicarla en la agenda al hacer clic. */
	startsAt: string;
}

export function notificationFromApi(
	item: NotificationItem,
	now: number = Date.now(),
): NotificationView {
	return {
		id: item.id,
		sessionId: item.sessionId,
		kind: ACTIVITY_META[item.kind].kind,
		// `notificationMessage` solo devuelve `null` para `MOVED`, que nunca llega
		// en la campana (la actividad no lo deriva).
		text:
			notificationMessage(item.kind, item.childName, item.startsAt) ??
			item.childName,
		relative: relativeTime(item.at, now),
		unread: item.unread,
		startsAt: item.startsAt,
	};
}

/** Texto del toast de un evento en vivo, o `null` si no corresponde avisar. */
export function toastMessageFor(event: SessionEvent): string | null {
	if (event.actor === "EDUCATOR") return null;
	return notificationMessage(event.kind, event.childName, event.startsAt);
}
