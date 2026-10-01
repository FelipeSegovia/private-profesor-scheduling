import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SlotRef } from "@/data/agenda";
import type { PanelChildDto, PanelGuardianListItem } from "@/data/api-types";
import { formatLongDate } from "@/data/dashboard";
import { useCreateSession } from "@/data/queries/useCreateSession";
import { useGuardianDetail } from "@/data/queries/useGuardianDetail";
import { useGuardians } from "@/data/queries/useGuardians";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const ERROR_MESSAGES: Record<string, string> = {
	PAST_SLOT: "Ese cupo ya pasó.",
	CHILD_NOT_FOUND: "No se encontró ese niño.",
	SLOT_BLOCKED: "Ese cupo está bloqueado.",
	SLOT_TAKEN: "Ese cupo ya fue tomado por otra sesión.",
};

interface CreateSessionDialogProps {
	slot: SlotRef | null;
	onOpenChange: (open: boolean) => void;
}

function errorMessage(error: unknown): string {
	if (error instanceof ApiError && error.code && ERROR_MESSAGES[error.code]) {
		return ERROR_MESSAGES[error.code];
	}
	return "No se pudo crear la cita. Intenta de nuevo.";
}

export function CreateSessionDialog({
	slot,
	onOpenChange,
}: CreateSessionDialogProps) {
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [guardian, setGuardian] = useState<PanelGuardianListItem | null>(null);
	const [child, setChild] = useState<PanelChildDto | null>(null);
	const [helpRequest, setHelpRequest] = useState("");

	useEffect(() => {
		if (!slot) {
			setSearch("");
			setDebouncedSearch("");
			setGuardian(null);
			setChild(null);
			setHelpRequest("");
		}
	}, [slot]);

	useEffect(() => {
		const timeout = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(timeout);
	}, [search]);

	const { data: guardiansData, isPending: isSearching } =
		useGuardians(debouncedSearch);
	const { data: guardianDetail, isPending: isLoadingChildren } =
		useGuardianDetail(guardian?.id ?? null);
	const createSession = useCreateSession();

	const guardians = guardiansData?.guardians ?? [];
	const children = guardianDetail?.children ?? [];

	function handleSelectGuardian(item: PanelGuardianListItem) {
		setGuardian(item);
		setChild(null);
	}

	function handleCreate() {
		if (!slot || !child) return;
		createSession.mutate(
			{
				childId: child.id,
				startsAt: slot.startsAt,
				helpRequest: helpRequest.trim() || undefined,
			},
			{ onSuccess: () => onOpenChange(false) },
		);
	}

	return (
		<Dialog
			open={Boolean(slot)}
			onOpenChange={(open) => {
				if (!open) createSession.reset();
				onOpenChange(open);
			}}
		>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Nueva cita</DialogTitle>
					{slot && (
						<DialogDescription>
							{formatLongDate(slot.date)} · {slot.time}
						</DialogDescription>
					)}
				</DialogHeader>

				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="guardian-search">Apoderado</Label>
						<Input
							id="guardian-search"
							placeholder="Buscar por nombre"
							value={guardian ? guardian.name : search}
							onChange={(e) => {
								setGuardian(null);
								setChild(null);
								setSearch(e.target.value);
							}}
						/>
						{!guardian && (
							<ul className="flex max-h-40 flex-col overflow-y-auto rounded-lg border border-border">
								{isSearching && (
									<li className="px-3 py-2 text-sm text-muted-foreground">
										Buscando…
									</li>
								)}
								{!isSearching && guardians.length === 0 && (
									<li className="px-3 py-2 text-sm text-muted-foreground">
										Sin resultados
									</li>
								)}
								{guardians.map((item) => (
									<li key={item.id}>
										<button
											type="button"
											onClick={() => handleSelectGuardian(item)}
											className="w-full px-3 py-2 text-left text-sm hover:bg-secondary"
										>
											<p className="font-medium text-foreground">{item.name}</p>
											<p className="text-xs text-muted-foreground">
												{item.email}
											</p>
										</button>
									</li>
								))}
							</ul>
						)}
					</div>

					{guardian && (
						<div className="flex flex-col gap-1.5">
							<Label>Niño</Label>
							{isLoadingChildren && (
								<p className="text-sm text-muted-foreground">Cargando…</p>
							)}
							{!isLoadingChildren && children.length === 0 && (
								<p className="text-sm text-muted-foreground">
									Este apoderado no tiene niños registrados.
								</p>
							)}
							{!isLoadingChildren && children.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{children.map((item) => (
										<button
											key={item.id}
											type="button"
											onClick={() => setChild(item)}
											className={cn(
												"rounded-lg border px-3 py-1.5 text-sm",
												child?.id === item.id
													? "border-primary bg-secondary text-primary"
													: "border-border text-foreground hover:bg-secondary",
											)}
										>
											{item.name} · {item.age} años
										</button>
									))}
								</div>
							)}
						</div>
					)}

					<div className="flex flex-col gap-1.5">
						<Label htmlFor="help-request">Motivo (opcional)</Label>
						<Input
							id="help-request"
							placeholder="Ej: refuerzo de lectura"
							value={helpRequest}
							onChange={(e) => setHelpRequest(e.target.value)}
						/>
					</div>

					{createSession.isError && (
						<p className="text-sm text-destructive">
							{errorMessage(createSession.error)}
						</p>
					)}
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancelar
					</Button>
					<Button
						type="button"
						disabled={!child || createSession.isPending}
						onClick={handleCreate}
					>
						{createSession.isPending ? "Creando…" : "Crear cita"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
