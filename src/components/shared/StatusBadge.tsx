import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SessionStatus } from "@/data/dashboard";

/**
 * Usada por `AgendaCard` y `AgendaPage`. El backend ya manda 4 estados
 * (`pendiente | confirmada | no confirmada | cancelada`); antes de conectar
 * al backend real esta app solo conocía los primeros dos.
 */
export function StatusBadge({ status }: { status: SessionStatus }) {
	if (status === "confirmada") {
		return (
			<Badge className="gap-1 border-transparent bg-success-soft text-success hover:bg-success-soft">
				<Check className="size-3" strokeWidth={3} />
				Confirmada
			</Badge>
		);
	}

	if (status === "no confirmada") {
		return (
			<Badge className="gap-1 border-transparent bg-destructive/10 text-destructive hover:bg-destructive/10">
				<X className="size-3" strokeWidth={3} />
				No confirmada
			</Badge>
		);
	}

	if (status === "cancelada") {
		return (
			<Badge variant="secondary" className="text-muted-foreground">
				Cancelada
			</Badge>
		);
	}

	return (
		<Badge className="border-transparent bg-warning-soft text-warning hover:bg-warning-soft">
			Pendiente
		</Badge>
	);
}
