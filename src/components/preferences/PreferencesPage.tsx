import { Clock } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { WorkDayView } from "@/data/api-types";
import { usePreferences } from "@/data/queries/usePreferences";
import { DeadlinesDialog } from "./DeadlinesDialog";
import { PublicSiteQrCard } from "./PublicSiteQrCard";
import { WorkDayDialog } from "./WorkDayDialog";

function PreferencesSkeleton() {
	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
			<div className="flex flex-col gap-3">
				<Skeleton className="h-4 w-36" />
				<Skeleton className="h-10 w-56" />
				<Skeleton className="h-4 w-72" />
			</div>
			<Skeleton className="h-72 rounded-2xl" />
			<Skeleton className="h-40 rounded-2xl" />
		</div>
	);
}

function formatRange(start: string, end: string) {
	return `${start} – ${end}`;
}

export function PreferencesPage() {
	const { data: preferences, isPending, isError, refetch } = usePreferences();
	const [editingWeekday, setEditingWeekday] = useState<number | null>(null);
	const [deadlinesOpen, setDeadlinesOpen] = useState(false);
	const [orphanSessions, setOrphanSessions] = useState(0);

	if (isPending) {
		return <PreferencesSkeleton />;
	}

	if (isError || !preferences) {
		return (
			<div className="mx-auto max-w-6xl rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
				<p className="font-semibold text-foreground">
					No se pudieron cargar las preferencias
				</p>
				<p className="mt-1 text-sm text-muted-foreground">
					Revisa la conexión o intenta de nuevo.
				</p>
				<Button type="button" className="mt-4" onClick={() => refetch()}>
					Reintentar
				</Button>
			</div>
		);
	}

	const editingDay: WorkDayView | null =
		preferences.workWeek.find((d) => d.weekday === editingWeekday) ?? null;

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:gap-8">
			<div>
				<p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">
					Configuración
				</p>
				<h1 className="mt-1 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
					Preferencias
				</h1>
				<p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
					Jornada laboral, plazos de confirmación y enlace público de reservas.
				</p>
			</div>

			<Card className="rounded-2xl shadow-sm ring-border">
				<CardHeader>
					<CardTitle className="font-serif text-2xl tracking-tight">
						Horarios
					</CardTitle>
					<CardDescription>
						Jornada laboral por día. Los cupos duran 1 hora cada uno.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{orphanSessions > 0 && (
						<p className="mb-3 rounded-xl bg-secondary px-4 py-3 text-sm text-foreground">
							{orphanSessions === 1
								? "1 sesión futura quedó fuera del horario; sigue agendada."
								: `${orphanSessions} sesiones futuras quedaron fuera del horario; siguen agendadas.`}
						</p>
					)}
					<ul className="flex flex-col gap-2">
						{preferences.workWeek.map((day) => {
							const slotCount = day.times.length;
							return (
								<li
									key={day.weekday}
									className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3"
								>
									<div className="min-w-0">
										<p className="text-sm font-semibold text-foreground">
											{day.label}
										</p>
										{day.available ? (
											<p className="mt-0.5 text-xs text-muted-foreground">
												{slotCount}{" "}
												{slotCount === 1 ? "cupo de 1 hora" : "cupos de 1 hora"}
												{!day.contiguous ? " · con huecos en la jornada" : ""}
											</p>
										) : (
											<p className="mt-0.5 text-xs text-muted-foreground">
												Puede activarlo si quiere atender ese día.
											</p>
										)}
									</div>

									<div className="flex items-center gap-2">
										{day.available && day.start && day.end ? (
											<span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-sm font-semibold text-primary">
												<Clock className="size-3.5" />
												{formatRange(day.start, day.end)}
											</span>
										) : (
											<Badge
												variant="secondary"
												className="text-muted-foreground"
											>
												No trabaja
											</Badge>
										)}
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => {
												setOrphanSessions(0);
												setEditingWeekday(day.weekday);
											}}
										>
											Editar
										</Button>
									</div>
								</li>
							);
						})}
					</ul>
				</CardContent>
			</Card>

			<Card className="rounded-2xl shadow-sm ring-border">
				<CardHeader>
					<CardTitle className="font-serif text-2xl tracking-tight">
						Plazos
					</CardTitle>
					<CardDescription>
						Confirmación de citas, aviso previo de series y horizonte de reserva
					</CardDescription>
					<CardAction>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setDeadlinesOpen(true)}
						>
							Editar plazos
						</Button>
					</CardAction>
				</CardHeader>
				<CardContent>
					<dl className="grid gap-3 sm:grid-cols-3">
						<div className="rounded-xl border border-border bg-background px-4 py-4">
							<dt className="text-sm font-semibold text-foreground">
								Plazo de confirmación
							</dt>
							<dd className="mt-1 font-serif text-3xl font-medium text-primary">
								{preferences.confirmationDeadlineHours} h
							</dd>
							<p className="mt-1 text-xs text-muted-foreground">
								Tiempo que tiene el apoderado para confirmar la cita.
							</p>
						</div>
						<div className="rounded-xl border border-border bg-background px-4 py-4">
							<dt className="text-sm font-semibold text-foreground">
								Antelación del correo de serie
							</dt>
							<dd className="mt-1 font-serif text-3xl font-medium text-primary">
								{preferences.seriesNoticeHours} h
							</dd>
							<p className="mt-1 text-xs text-muted-foreground">
								Aviso al apoderado antes de cada sesión de una serie.
							</p>
						</div>
						<div className="rounded-xl border border-border bg-background px-4 py-4">
							<dt className="text-sm font-semibold text-foreground">
								Horizonte de reserva
							</dt>
							<dd className="mt-1 font-serif text-3xl font-medium text-primary">
								{preferences.bookingHorizonWeeks} sem.
							</dd>
							<p className="mt-1 text-xs text-muted-foreground">
								Semanas hacia adelante que se pueden reservar.
							</p>
						</div>
					</dl>
				</CardContent>
			</Card>

			<PublicSiteQrCard />

			<WorkDayDialog
				day={editingDay}
				workWeek={preferences.workWeek}
				onOpenChange={(open) => {
					if (!open) setEditingWeekday(null);
				}}
				onSaved={setOrphanSessions}
			/>
			<DeadlinesDialog
				open={deadlinesOpen}
				preferences={preferences}
				onOpenChange={setDeadlinesOpen}
			/>
		</div>
	);
}
