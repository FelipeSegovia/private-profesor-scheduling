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
import type { PanelPreferencesResponse } from "@/data/api-types";
import { validatePreferences } from "@/data/preferences";
import { useUpdatePreferences } from "@/data/queries/useUpdatePreferences";
import { ApiError } from "@/lib/api/client";

interface DeadlinesDialogProps {
	open: boolean;
	preferences: PanelPreferencesResponse;
	onOpenChange: (open: boolean) => void;
}

export function DeadlinesDialog({
	open,
	preferences,
	onOpenChange,
}: DeadlinesDialogProps) {
	const [confirmation, setConfirmation] = useState("");
	const [seriesNotice, setSeriesNotice] = useState("");
	const [horizon, setHorizon] = useState("");
	const [localError, setLocalError] = useState<string | null>(null);
	const updatePreferences = useUpdatePreferences();

	// biome-ignore lint/correctness/useExhaustiveDependencies: solo reinicia al abrir, no cuando la caché se refresca con el diálogo abierto
	useEffect(() => {
		if (open) {
			setConfirmation(String(preferences.confirmationDeadlineHours));
			setSeriesNotice(String(preferences.seriesNoticeHours));
			setHorizon(String(preferences.bookingHorizonWeeks));
			setLocalError(null);
			updatePreferences.reset();
		}
	}, [open]);

	function handleSave() {
		const body = {
			// `Number("")` es 0 y pasaría por vacío como entero: tratarlo como inválido.
			confirmationDeadlineHours: confirmation.trim()
				? Number(confirmation)
				: NaN,
			seriesNoticeHours: seriesNotice.trim() ? Number(seriesNotice) : NaN,
			bookingHorizonWeeks: horizon.trim() ? Number(horizon) : NaN,
		};
		const issue = validatePreferences(body);
		if (issue) {
			setLocalError(issue.message);
			return;
		}
		updatePreferences.mutate(body, { onSuccess: () => onOpenChange(false) });
	}

	const backendError = updatePreferences.isError
		? updatePreferences.error instanceof ApiError
			? updatePreferences.error.message
			: "No se pudieron guardar los plazos. Intenta de nuevo."
		: null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Editar plazos</DialogTitle>
					<DialogDescription>
						El aviso de serie tiene que salir antes de que venza el plazo de
						confirmación.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="confirmation-hours">
							Plazo de confirmación (horas)
						</Label>
						<Input
							id="confirmation-hours"
							type="number"
							min={1}
							step={1}
							value={confirmation}
							onChange={(e) => setConfirmation(e.target.value)}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="series-notice-hours">
							Antelación del correo de serie (horas)
						</Label>
						<Input
							id="series-notice-hours"
							type="number"
							min={1}
							step={1}
							value={seriesNotice}
							onChange={(e) => setSeriesNotice(e.target.value)}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="horizon-weeks">
							Horizonte de reserva (semanas, 1 a 52)
						</Label>
						<Input
							id="horizon-weeks"
							type="number"
							min={1}
							max={52}
							step={1}
							value={horizon}
							onChange={(e) => setHorizon(e.target.value)}
						/>
					</div>

					{(localError || backendError) && (
						<p className="text-sm text-destructive">
							{localError ?? backendError}
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
						disabled={updatePreferences.isPending}
						onClick={handleSave}
					>
						{updatePreferences.isPending ? "Guardando…" : "Guardar"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
