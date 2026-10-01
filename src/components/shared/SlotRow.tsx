import { Lock, Plus } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DaySlot } from "@/data/agenda";

interface SlotRowProps {
	slot: DaySlot;
	onAgendar: (slot: DaySlot) => void;
}

export function SlotRow({ slot, onAgendar }: SlotRowProps) {
	if (slot.kind === "session" && slot.session) {
		const session = slot.session;
		return (
			<li className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background px-3 py-3 sm:flex-nowrap sm:gap-4 sm:px-4">
				<div className="w-14 shrink-0">
					<p className="text-base font-semibold text-foreground">{slot.time}</p>
					<p className="text-xs text-muted-foreground">{slot.duration}</p>
				</div>
				<Avatar className="bg-secondary after:border-transparent">
					<AvatarFallback className="bg-secondary text-xs font-semibold text-primary">
						{session.initials}
					</AvatarFallback>
				</Avatar>
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-semibold text-foreground">
						{session.childName}
					</p>
					<p className="truncate text-xs text-muted-foreground">
						{session.guardianName}
					</p>
				</div>
				<StatusBadge status={session.status} />
			</li>
		);
	}

	if (slot.kind === "bloqueado") {
		return (
			<li className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/60 px-3 py-3 sm:flex-nowrap sm:gap-4 sm:px-4">
				<div className="w-14 shrink-0">
					<p className="text-base font-semibold text-foreground">{slot.time}</p>
					<p className="text-xs text-muted-foreground">{slot.duration}</p>
				</div>
				<span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
					<Lock className="size-3.5" />
				</span>
				<div className="min-w-0 flex-1">
					<p className="text-sm font-semibold text-foreground">
						Cupo bloqueado
					</p>
					<p className="text-xs text-muted-foreground">
						No disponible para reservar
					</p>
				</div>
				<Badge variant="secondary" className="text-muted-foreground">
					Bloqueado
				</Badge>
			</li>
		);
	}

	if (slot.kind === "fuera_de_horizonte") {
		return (
			<li className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-3 py-3 sm:flex-nowrap sm:gap-4 sm:px-4">
				<div className="w-14 shrink-0">
					<p className="text-base font-semibold text-muted-foreground">
						{slot.time}
					</p>
					<p className="text-xs text-muted-foreground">{slot.duration}</p>
				</div>
				<div className="min-w-0 flex-1">
					<p className="text-sm font-semibold text-muted-foreground">
						Fuera del horizonte de reserva
					</p>
					<p className="text-xs text-muted-foreground">
						Todavía no se puede reservar esta fecha
					</p>
				</div>
			</li>
		);
	}

	return (
		<li className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-brand-selected bg-background px-3 py-3 sm:flex-nowrap sm:gap-4 sm:px-4">
			<div className="w-14 shrink-0">
				<p className="text-base font-semibold text-primary">{slot.time}</p>
				<p className="text-xs text-muted-foreground">{slot.duration}</p>
			</div>
			<div className="min-w-0 flex-1">
				<p className="text-sm font-semibold text-primary">Cupo disponible</p>
				<p className="text-xs text-muted-foreground">Listo para reservar</p>
			</div>
			<Button
				type="button"
				variant="outline"
				className="border-primary/40 text-primary"
				onClick={() => onAgendar(slot)}
			>
				<Plus className="size-4" strokeWidth={2.5} />
				Agendar
			</Button>
		</li>
	);
}
