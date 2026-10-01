import { initialsFrom, STATUS_MAP } from "@/data/adapters/summary";
import type { DaySlot, SlotKind } from "@/data/agenda";
import type {
	PanelAgendaResponse,
	SlotCell,
	SlotCellSession,
} from "@/data/api-types";
import type { Session } from "@/data/dashboard";

const KIND_BY_STATE: Record<SlotCell["state"], SlotKind> = {
	FREE: "libre",
	BOOKED: "session",
	BLOCKED_DAY: "bloqueado",
	BLOCKED_SLOT: "bloqueado",
	BEYOND_HORIZON: "fuera_de_horizonte",
};

function sessionFromCell(
	session: SlotCellSession,
	date: string,
	time: string,
): Session {
	return {
		id: session.id,
		date,
		time,
		duration: "1 hora",
		childName: session.childName,
		guardianName: session.guardianName,
		initials: initialsFrom(session.childName),
		status: STATUS_MAP[session.status],
	};
}

function cellToDaySlot(cell: SlotCell): DaySlot {
	return {
		id: `${cell.date}-${cell.time}`,
		date: cell.date,
		time: cell.time,
		startsAt: cell.startsAt,
		duration: "1 hora",
		past: cell.past,
		kind: KIND_BY_STATE[cell.state],
		session: cell.session
			? sessionFromCell(cell.session, cell.date, cell.time)
			: undefined,
	};
}

/** Cupos del día `dateIso` dentro de la respuesta de `/api/panel/agenda`. */
export function daySlotsFromApi(
	agenda: PanelAgendaResponse,
	dateIso: string,
): DaySlot[] {
	const day = agenda.days.find((d) => d.date === dateIso);
	if (!day) return [];
	return day.cells.map(cellToDaySlot);
}
