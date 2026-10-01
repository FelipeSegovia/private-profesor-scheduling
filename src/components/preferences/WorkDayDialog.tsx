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
import { Label } from "@/components/ui/label";
import type { WorkDayView } from "@/data/api-types";
import {
	buildWorkWeekPayload,
	endHoursFor,
	START_HOURS,
	slotsInRange,
	validateWorkDay,
} from "@/data/preferences";
import { useUpdateTemplate } from "@/data/queries/useUpdateTemplate";
import { ApiError } from "@/lib/api/client";

const DEFAULT_START = "19:00";
const DEFAULT_END = "21:00";

const SELECT_CLASS =
	"h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

interface WorkDayDialogProps {
	day: WorkDayView | null;
	workWeek: WorkDayView[];
	onOpenChange: (open: boolean) => void;
	onSaved: (orphanSessions: number) => void;
}

/** Opciones del select, incluyendo el valor actual aunque quede fuera del rango habitual. */
function withCurrent(options: string[], current: string): string[] {
	return options.includes(current) ? options : [...options, current].sort();
}

export function WorkDayDialog({
	day,
	workWeek,
	onOpenChange,
	onSaved,
}: WorkDayDialogProps) {
	const [available, setAvailable] = useState(false);
	const [start, setStart] = useState(DEFAULT_START);
	const [end, setEnd] = useState(DEFAULT_END);
	const [localError, setLocalError] = useState<string | null>(null);
	const updateTemplate = useUpdateTemplate();

	// biome-ignore lint/correctness/useExhaustiveDependencies: solo reinicia al abrir otro día
	useEffect(() => {
		if (day) {
			setAvailable(day.available);
			setStart(day.start ?? DEFAULT_START);
			setEnd(day.end ?? DEFAULT_END);
			setLocalError(null);
			updateTemplate.reset();
		}
	}, [day]);

	function handleStartChange(value: string) {
		setStart(value);
		// Mantener un rango válido: si el término ya no es posterior, subirlo una hora.
		if (!endHoursFor(value).includes(end)) {
			setEnd(endHoursFor(value)[0] ?? end);
		}
		setLocalError(null);
	}

	function handleSave() {
		if (!day) return;
		const edited = {
			weekday: day.weekday,
			available,
			start: available ? start : null,
			end: available ? end : null,
		};
		const issue = validateWorkDay(edited);
		if (issue) {
			setLocalError(issue);
			return;
		}
		updateTemplate.mutate(
			{ workWeek: buildWorkWeekPayload(workWeek, edited) },
			{
				onSuccess: (result) => {
					onSaved(result.orphanSessions);
					onOpenChange(false);
				},
			},
		);
	}

	const gapsHere = day && !day.contiguous ? day : null;
	const gapsElsewhere = workWeek.filter(
		(d) => d.weekday !== day?.weekday && !d.contiguous,
	);
	const slots = slotsInRange(start, end);
	const backendError = updateTemplate.isError
		? updateTemplate.error instanceof ApiError
			? updateTemplate.error.message
			: "No se pudo guardar el horario. Intenta de nuevo."
		: null;

	return (
		<Dialog open={Boolean(day)} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{day?.label}</DialogTitle>
					<DialogDescription>
						Cambiar la jornada no borra sesiones ya agendadas; solo cambia los
						cupos libres.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4">
					<label className="flex items-center gap-2 text-sm font-medium text-foreground">
						<input
							type="checkbox"
							className="size-4 accent-primary"
							checked={available}
							onChange={(e) => {
								setAvailable(e.target.checked);
								setLocalError(null);
							}}
						/>
						Atiende este día
					</label>

					{available && (
						<>
							<div className="grid grid-cols-2 gap-3">
								<div className="flex flex-col gap-1.5">
									<Label htmlFor="work-start">Desde</Label>
									<select
										id="work-start"
										className={SELECT_CLASS}
										value={start}
										onChange={(e) => handleStartChange(e.target.value)}
									>
										{withCurrent(START_HOURS, start).map((hour) => (
											<option key={hour} value={hour}>
												{hour}
											</option>
										))}
									</select>
								</div>
								<div className="flex flex-col gap-1.5">
									<Label htmlFor="work-end">Hasta</Label>
									<select
										id="work-end"
										className={SELECT_CLASS}
										value={end}
										onChange={(e) => {
											setEnd(e.target.value);
											setLocalError(null);
										}}
									>
										{withCurrent(endHoursFor(start), end).map((hour) => (
											<option key={hour} value={hour}>
												{hour}
											</option>
										))}
									</select>
								</div>
							</div>
							<p className="text-sm text-muted-foreground">
								{start} – {end} · {slots}{" "}
								{slots === 1 ? "cupo de 1 hora" : "cupos de 1 hora"}
							</p>
						</>
					)}

					{gapsHere && (
						<p className="rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">
							Hoy este día tiene huecos ({gapsHere.times.join(", ")}). Al
							guardar se usará el rango completo.
						</p>
					)}
					{gapsElsewhere.length > 0 && (
						<p className="rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">
							Al guardar también se rellenarán los huecos de{" "}
							{gapsElsewhere.map((d) => d.label).join(", ")}: el sistema guarda
							toda la semana a la vez y solo admite un rango por día.
						</p>
					)}

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
						disabled={updateTemplate.isPending}
						onClick={handleSave}
					>
						{updateTemplate.isPending ? "Guardando…" : "Guardar"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
