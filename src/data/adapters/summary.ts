import type {
	ActivityItem as ApiActivityItem,
	SessionStatus as ApiSessionStatus,
	PanelSessionDto,
	PanelStats,
	PanelSummaryResponse,
	SlotCell,
} from "@/data/api-types";
import {
	type ActivityItem,
	type AttentionItem,
	type AvailableSlot,
	formatLongDate,
	type Quote,
	type SessionStatus,
	type StatCard,
	type SummaryResponse,
} from "@/data/dashboard";

export const STATUS_MAP: Record<ApiSessionStatus, SessionStatus> = {
	PENDING: "pendiente",
	CONFIRMED: "confirmada",
	NOT_CONFIRMED: "no confirmada",
	CANCELLED: "cancelada",
};

export function initialsFrom(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	return parts
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("");
}

function attentionFrom(dto: PanelSessionDto, today: string): AttentionItem {
	const detail =
		dto.date === today
			? `Sesión hoy a las ${dto.time}`
			: `Sesión el ${formatLongDate(dto.date)} a las ${dto.time}`;
	return {
		id: dto.id,
		childName: dto.childName,
		date: dto.date,
		detail,
		statusLabel: "Esperando confirmación",
	};
}

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
	timeZone: "America/Santiago",
	weekday: "long",
	day: "numeric",
	month: "long",
});
export const timeFormatter = new Intl.DateTimeFormat("es-CL", {
	timeZone: "America/Santiago",
	hour: "2-digit",
	minute: "2-digit",
	hour12: false,
});

function capitalize(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

export const ACTIVITY_META: Record<
	ApiActivityItem["kind"],
	{
		kind: ActivityItem["kind"];
		badge: string;
		title: (childName: string, actor: string) => string;
	}
> = {
	CREATED: {
		kind: "creacion",
		badge: "Nueva reserva",
		title: () => "Se registró una nueva sesión",
	},
	CONFIRMED: {
		kind: "confirmacion",
		badge: "Confirmación",
		title: (childName, actor) =>
			actor === "GUARDIAN"
				? `${childName} confirmó su sesión`
				: `Se confirmó la sesión de ${childName}`,
	},
	CANCELLED: {
		kind: "cancelacion",
		badge: "Cancelación",
		title: (childName, actor) =>
			actor === "GUARDIAN"
				? `${childName} canceló su sesión`
				: `Se canceló la sesión de ${childName}`,
	},
	NOT_CONFIRMED: {
		kind: "no_confirmada",
		badge: "Sin confirmar",
		title: (childName) => `La sesión de ${childName} venció sin confirmar`,
	},
};

function activityFrom(item: ApiActivityItem): ActivityItem {
	const meta = ACTIVITY_META[item.kind];
	const at = new Date(item.at);
	return {
		id: item.id,
		kind: meta.kind,
		title: meta.title(item.childName, item.actor),
		meta: `${capitalize(dateFormatter.format(at))} a las ${timeFormatter.format(at)}`,
		badge: meta.badge,
	};
}

function statsToCards(stats: PanelStats): StatCard[] {
	return [
		{
			id: "today",
			label: "Citas de hoy",
			value: String(stats.today),
			hint: "Sesiones activas de hoy",
			icon: "calendar",
		},
		{
			id: "confirmed",
			label: "Confirmadas",
			value: String(stats.confirmed),
			hint: "De aquí al domingo",
			icon: "check",
		},
		{
			id: "pending",
			label: "Por confirmar",
			value: String(stats.pending),
			hint: "Sin confirmar, a futuro",
			icon: "clock",
		},
		{
			id: "families",
			label: "Familias activas",
			value: String(stats.families),
			hint: "Con sesiones vigentes",
			icon: "users",
		},
	];
}

function availableSlotFrom(slot: SlotCell | null): AvailableSlot | null {
	if (!slot) return null;
	return {
		date: slot.date,
		time: slot.time,
		startsAt: slot.startsAt,
		title: "Cupo disponible",
		hint: "Listo para reservar",
	};
}

const QUOTE: Quote = {
	text: "Cada pequeño paso cuenta en el proceso de acompañar.",
	attribution: "Tu espacio de apoyo",
};

function greetingDateLabel(today: string): string {
	const [year] = today.split("-");
	return `${formatLongDate(today)} de ${year}`;
}

export function summaryFromApi(
	response: PanelSummaryResponse,
): SummaryResponse {
	const [firstName] = response.educator.name.trim().split(/\s+/);
	return {
		educator: {
			firstName: firstName ?? response.educator.name,
			fullName: response.educator.name,
			role: "Educadora diferencial",
			initials: initialsFrom(response.educator.name),
		},
		greetingDateLabel: greetingDateLabel(response.today),
		today: response.today,
		weekStart: response.weekStart,
		stats: statsToCards(response.stats),
		availableSlot: availableSlotFrom(response.nextFreeSlot),
		attentionItems: response.attention.map((dto) =>
			attentionFrom(dto, response.today),
		),
		activities: response.activity.map(activityFrom),
		quote: QUOTE,
	};
}
