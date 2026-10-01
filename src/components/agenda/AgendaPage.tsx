import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CreateSessionDialog } from "@/components/agenda/CreateSessionDialog";
import { SlotRow } from "@/components/shared/SlotRow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { daySlotsFromApi } from "@/data/adapters/agenda";
import type { DaySlot, SlotKind } from "@/data/agenda";
import {
	addDays,
	formatLongDate,
	formatMonthYear,
	getWeekDays,
	mondayOf,
	todayChileYmd,
} from "@/data/dashboard";
import { useAgenda } from "@/data/queries/useAgenda";
import { cn } from "@/lib/utils";
import { useAgendaViewStore } from "@/store/agendaViewStore";

function countByKind(slots: DaySlot[], kind: SlotKind) {
	return slots.filter((s) => s.kind === kind).length;
}

function AgendaSkeleton() {
	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
			<div className="flex flex-col gap-3">
				<Skeleton className="h-4 w-40" />
				<Skeleton className="h-10 w-64" />
				<Skeleton className="h-4 w-80" />
			</div>
			<Skeleton className="h-[32rem] rounded-2xl" />
		</div>
	);
}

export function AgendaPage() {
	const {
		weekStart,
		selectedDate,
		setWeekStart,
		setSelectedDate,
		initializeIfEmpty,
	} = useAgendaViewStore();
	const today = todayChileYmd();
	const [selectedSlot, setSelectedSlot] = useState<DaySlot | null>(null);

	useEffect(() => {
		initializeIfEmpty(mondayOf(today), today);
	}, [initializeIfEmpty, today]);

	const effectiveWeekStart = weekStart || mondayOf(today);
	const effectiveSelectedDate = selectedDate || today;

	const {
		data: agenda,
		isPending,
		isError,
		refetch,
	} = useAgenda(effectiveWeekStart);

	const weekDays = useMemo(
		() => getWeekDays(effectiveWeekStart),
		[effectiveWeekStart],
	);
	const daySlots = useMemo(
		() => (agenda ? daySlotsFromApi(agenda, effectiveSelectedDate) : []),
		[agenda, effectiveSelectedDate],
	);

	const sessionCount = countByKind(daySlots, "session");
	const freeCount = countByKind(daySlots, "libre");
	const firstFreeSlot = daySlots.find((s) => s.kind === "libre") ?? null;

	if (isPending) {
		return <AgendaSkeleton />;
	}

	if (isError || !agenda) {
		return (
			<div className="mx-auto max-w-6xl rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
				<p className="font-semibold text-foreground">
					No se pudo cargar la agenda
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

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:gap-8">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">
						Agenda completa
					</p>
					<h1 className="mt-1 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
						Mi agenda
					</h1>
					<p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
						Revisa cupos libres, sesiones y bloqueos por día.
					</p>
				</div>
				<Button
					type="button"
					className="shrink-0 rounded-xl"
					disabled={!firstFreeSlot}
					onClick={() => firstFreeSlot && setSelectedSlot(firstFreeSlot)}
				>
					<Plus className="size-4" strokeWidth={2.5} />
					Nueva cita
				</Button>
			</div>

			<Card className="rounded-2xl shadow-sm ring-border">
				<CardHeader>
					<CardTitle className="font-serif text-2xl tracking-tight">
						Semana
					</CardTitle>
					<CardDescription>
						Plantilla de cupos con duración de 1 hora · Hora de Chile
					</CardDescription>
				</CardHeader>

				<CardContent className="flex flex-col gap-5">
					<div className="flex items-center justify-between gap-2">
						<Button
							type="button"
							variant="ghost"
							size="icon-lg"
							aria-label="Semana anterior"
							onClick={() => {
								const nextStart = addDays(effectiveWeekStart, -7);
								setWeekStart(nextStart);
								setSelectedDate(nextStart);
							}}
						>
							<ChevronLeft className="size-5" />
						</Button>
						<p className="text-sm font-semibold text-foreground">
							{formatMonthYear(effectiveWeekStart)}
						</p>
						<Button
							type="button"
							variant="ghost"
							size="icon-lg"
							aria-label="Semana siguiente"
							onClick={() => {
								const nextStart = addDays(effectiveWeekStart, 7);
								setWeekStart(nextStart);
								setSelectedDate(nextStart);
							}}
						>
							<ChevronRight className="size-5" />
						</Button>
					</div>

					<div className="grid grid-cols-7 gap-1.5 sm:gap-2">
						{weekDays.map((day) => {
							const selected = day.date === effectiveSelectedDate;
							return (
								<button
									key={day.date}
									type="button"
									onClick={() => setSelectedDate(day.date)}
									className={cn(
										"flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 transition",
										selected
											? "bg-primary text-primary-foreground shadow-md"
											: "border border-transparent bg-background text-foreground hover:border-border hover:bg-secondary",
									)}
								>
									<span
										className={cn(
											"text-[10px] font-semibold tracking-wide uppercase",
											selected ? "opacity-90" : "text-muted-foreground",
										)}
									>
										{day.dayLabel}
									</span>
									<span className="text-sm font-semibold sm:text-base">
										{day.dayNumber}
									</span>
								</button>
							);
						})}
					</div>

					<div className="flex flex-wrap items-center justify-between gap-2">
						<div>
							<h2 className="text-base font-semibold text-foreground">
								{formatLongDate(effectiveSelectedDate)}
							</h2>
							<p className="text-sm text-muted-foreground">
								{daySlots.length === 0
									? "Sin cupos en la plantilla"
									: `${sessionCount} ${sessionCount === 1 ? "sesión" : "sesiones"} · ${freeCount} ${freeCount === 1 ? "cupo libre" : "cupos libres"}`}
							</p>
						</div>
						<Badge variant="secondary" className="text-primary">
							Hora de Chile
						</Badge>
					</div>

					{daySlots.length === 0 ? (
						<div className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center">
							<p className="text-sm font-medium text-foreground">
								No hay cupos este día
							</p>
							<p className="mt-1 text-sm text-muted-foreground">
								La plantilla semanal no incluye horarios para este día.
							</p>
						</div>
					) : (
						<ul className="flex flex-col gap-3">
							{daySlots.map((slot) => (
								<SlotRow
									key={slot.id}
									slot={slot}
									onAgendar={setSelectedSlot}
								/>
							))}
						</ul>
					)}
				</CardContent>
			</Card>

			<CreateSessionDialog
				slot={selectedSlot}
				onOpenChange={(open) => {
					if (!open) setSelectedSlot(null);
				}}
			/>
		</div>
	);
}
