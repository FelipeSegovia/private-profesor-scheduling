import type { SessionEventKind } from "@/data/api-types";

// Lógica pura de textos y fechas de los avisos. Sin imports de runtime (solo
// tipos), para poder verificarla con `node --experimental-strip-types`: esta
// app no tiene test runner. Todo en `America/Santiago`, no en la zona del
// navegador.

const slotDateFormatter = new Intl.DateTimeFormat("es-CL", {
	timeZone: "America/Santiago",
	weekday: "short",
	day: "numeric",
	month: "short",
});

const slotTimeFormatter = new Intl.DateTimeFormat("es-CL", {
	timeZone: "America/Santiago",
	hour: "2-digit",
	minute: "2-digit",
	hour12: false,
});

const shortDateFormatter = new Intl.DateTimeFormat("es-CL", {
	timeZone: "America/Santiago",
	day: "numeric",
	month: "short",
});

const relativeFormatter = new Intl.RelativeTimeFormat("es-CL", {
	numeric: "auto",
	style: "short",
});

function dateParts(date: Date) {
	const parts = slotDateFormatter.formatToParts(date);
	const pick = (type: Intl.DateTimeFormatPartTypes) =>
		(parts.find((part) => part.type === type)?.value ?? "").replace(
			/[.,]/g,
			"",
		);
	return { weekday: pick("weekday"), day: pick("day"), month: pick("month") };
}

/** Cupo de una cita para mostrar en un aviso: `"lun 5 oct · 19:00"`. */
export function slotLabel(startsAt: string): string {
	const date = new Date(startsAt);
	const { weekday, day, month } = dateParts(date);
	return `${weekday} ${day} ${month} · ${slotTimeFormatter.format(date)}`;
}

/**
 * Texto de un aviso (toast y campana). `null` para `MOVED`: lo mueve la
 * educadora, así que nunca se le avisa a ella misma.
 */
export function notificationMessage(
	kind: SessionEventKind,
	childName: string,
	startsAt: string,
): string | null {
	const slot = slotLabel(startsAt);
	switch (kind) {
		case "CREATED":
			return `Nueva reserva: ${childName}, ${slot}`;
		case "CONFIRMED":
			return `${childName} confirmó su cita del ${slot}`;
		case "CANCELLED":
			return `${childName} canceló su cita del ${slot}`;
		case "NOT_CONFIRMED":
			return `Se liberó el cupo de ${childName} (${slot}) por falta de confirmación`;
		case "MOVED":
			return null;
	}
}

/** `"justo ahora"`, `"hace 5 min"`, `"hace 3 h"`, `"ayer"`, `"hace 3 días"`; pasada una semana, `"7 oct"`. */
export function relativeTime(iso: string, now: number = Date.now()): string {
	const seconds = Math.floor((now - Date.parse(iso)) / 1000);
	// Reloj del servidor un poco adelantado: nunca "en el futuro".
	if (seconds < 60) return "justo ahora";

	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return relativeFormatter.format(-minutes, "minute");

	const hours = Math.floor(minutes / 60);
	if (hours < 24) return relativeFormatter.format(-hours, "hour");

	const days = Math.floor(hours / 24);
	if (days < 7) return relativeFormatter.format(-days, "day");

	return shortDateFormatter.format(new Date(iso)).replace(/[.,]/g, "");
}
