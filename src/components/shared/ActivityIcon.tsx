import { CalendarDays, Check, Clock, X } from "lucide-react";
import type { ActivityKind } from "@/data/dashboard";

/** Ícono redondo por tipo de actividad. Lo usan el resumen y la campana de avisos. */
export function ActivityIcon({ kind }: { kind: ActivityKind }) {
	if (kind === "confirmacion") {
		return (
			<span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
				<Check className="size-4" strokeWidth={3} />
			</span>
		);
	}

	if (kind === "cancelacion") {
		return (
			<span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
				<X className="size-4" strokeWidth={3} />
			</span>
		);
	}

	if (kind === "no_confirmada") {
		return (
			<span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
				<Clock className="size-4" />
			</span>
		);
	}

	return (
		<span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
			<CalendarDays className="size-4" />
		</span>
	);
}
