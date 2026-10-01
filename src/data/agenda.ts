import type { Session } from "./dashboard";

export type SlotKind = "session" | "libre" | "bloqueado" | "fuera_de_horizonte";

/**
 * Lo mínimo para identificar un cupo al crear una cita: `startsAt` es lo que
 * viaja al backend, `date`/`time` es lo que se le muestra a la educadora. Lo
 * satisfacen tanto `DaySlot` (agenda) como `AvailableSlot` (resumen).
 */
export interface SlotRef {
	date: string;
	time: string;
	startsAt: string;
}

export interface DaySlot {
	id: string;
	date: string;
	time: string;
	startsAt: string;
	duration: string;
	kind: SlotKind;
	/** El cupo ya ocurrió. Crear una cita sobre él responde `400 PAST_SLOT`. */
	past: boolean;
	session?: Session;
}

export function countByKind(slots: DaySlot[], kind: SlotKind): number {
	return slots.filter((slot) => slot.kind === kind).length;
}

/** Primer cupo agendable (libre y no pasado), para las entradas de "crear cita" sin cupo elegido. */
export function firstFreeSlot(slots: DaySlot[]): DaySlot | null {
	return slots.find((slot) => slot.kind === "libre" && !slot.past) ?? null;
}

/** Resumen del día ("2 sesiones · 1 cupo libre"), compartido por `/` y `/agenda`. */
export function daySummaryLabel(slots: DaySlot[]): string {
	if (slots.length === 0) return "Sin cupos en la plantilla";
	const sessions = countByKind(slots, "session");
	const free = countByKind(slots, "libre");
	return `${sessions} ${sessions === 1 ? "sesión" : "sesiones"} · ${free} ${
		free === 1 ? "cupo libre" : "cupos libres"
	}`;
}
