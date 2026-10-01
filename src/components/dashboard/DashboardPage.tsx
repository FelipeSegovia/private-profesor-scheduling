import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { CreateSessionDialog } from "@/components/agenda/CreateSessionDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { daySlotsFromApi } from "@/data/adapters/agenda";
import { firstFreeSlot, type SlotRef } from "@/data/agenda";
import {
	type ActivityItem,
	addDays,
	formatLongDate,
	formatMonthYear,
	getWeekDays,
	mondayOf,
} from "@/data/dashboard";
import { useAgenda } from "@/data/queries/useAgenda";
import { useSummary } from "@/data/queries/useSummary";
import { useAgendaViewStore } from "@/store/agendaViewStore";
import { AgendaCard } from "./AgendaCard";
import { AttentionCard } from "./AttentionCard";
import { QuickAccessCard } from "./QuickAccessCard";
import { type ActivityFilter, RecentActivity } from "./RecentActivity";
import { SlotAndHours } from "./SlotAndHours";
import { StatCards } from "./StatCards";

function filterActivities(items: ActivityItem[], filter: ActivityFilter) {
	if (filter === "reservas") {
		return items.filter((item) => item.kind === "creacion");
	}
	if (filter === "cambios") {
		return items.filter((item) => item.kind !== "creacion");
	}
	return items;
}

function DashboardSkeleton() {
	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:gap-8">
			<div className="flex flex-col gap-3">
				<Skeleton className="h-4 w-56" />
				<Skeleton className="h-10 w-80" />
				<Skeleton className="h-4 w-72" />
			</div>
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: lista estática de placeholders, nunca se reordena
					<Skeleton key={i} className="h-28 rounded-2xl" />
				))}
			</div>
			<div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
				<Skeleton className="h-96 rounded-2xl" />
				<div className="flex flex-col gap-4">
					<Skeleton className="h-48 rounded-2xl" />
					<Skeleton className="h-36 rounded-2xl" />
				</div>
			</div>
		</div>
	);
}

export function DashboardPage() {
	const navigate = useNavigate();
	const { data: summary, isPending, isError, refetch } = useSummary();
	const [activityFilter, setActivityFilter] = useState<ActivityFilter>("todas");
	const [selectedSlot, setSelectedSlot] = useState<SlotRef | null>(null);
	const {
		weekStart,
		selectedDate,
		setWeekStart,
		setSelectedDate,
		initializeIfEmpty,
	} = useAgendaViewStore();

	useEffect(() => {
		if (summary) {
			initializeIfEmpty(summary.weekStart, summary.today);
		}
	}, [summary, initializeIfEmpty]);

	// El store puede seguir vacío en el primer render tras cargar `summary`
	// (el efecto de arriba corre después del render); usamos el valor del
	// resumen como respaldo mientras tanto para no renderizar con fechas vacías.
	const effectiveWeekStart = weekStart || summary?.weekStart || "";
	const effectiveSelectedDate = selectedDate || summary?.today || "";

	const {
		data: agenda,
		isLoading: isAgendaLoading,
		isError: isAgendaError,
		refetch: refetchAgenda,
	} = useAgenda(effectiveWeekStart);

	const weekDays = useMemo(
		() => (effectiveWeekStart ? getWeekDays(effectiveWeekStart) : []),
		[effectiveWeekStart],
	);
	const daySlots = useMemo(
		() =>
			agenda && effectiveSelectedDate
				? daySlotsFromApi(agenda, effectiveSelectedDate)
				: [],
		[agenda, effectiveSelectedDate],
	);
	const filteredActivities = useMemo(
		() => (summary ? filterActivities(summary.activities, activityFilter) : []),
		[summary, activityFilter],
	);

	// Cupo que abren las entradas sin cupo elegido ("Nueva cita", accesos
	// rápidos): se prefiere lo que la educadora está viendo —día, luego resto de
	// la semana— porque el `availableSlot` del resumen siempre se calcula sobre
	// la semana de hoy y abriría una fecha fuera de pantalla.
	const createTargetSlot: SlotRef | null = useMemo(() => {
		const fromDay = firstFreeSlot(daySlots);
		if (fromDay) return fromDay;
		const weekSlots = agenda
			? agenda.days.flatMap((day) => daySlotsFromApi(agenda, day.date))
			: [];
		return firstFreeSlot(weekSlots) ?? summary?.availableSlot ?? null;
	}, [daySlots, agenda, summary]);

	if (isPending) {
		return <DashboardSkeleton />;
	}

	if (isError || !summary) {
		return (
			<div className="mx-auto max-w-6xl rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
				<p className="font-semibold text-foreground">
					No se pudo cargar el resumen
				</p>
				<p className="mt-1 text-sm text-muted-foreground">
					Revisa la conexión o recarga la página.
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
						{summary.greetingDateLabel}
					</p>
					<h1 className="mt-1 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
						Buenos días, {summary.educator.firstName}
					</h1>
					<p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
						Aquí tienes un resumen de lo que ocurre hoy.
					</p>
				</div>
				<Button
					type="button"
					className="shrink-0 rounded-xl"
					disabled={!createTargetSlot}
					onClick={() => setSelectedSlot(createTargetSlot)}
				>
					<Plus className="size-4" strokeWidth={2.5} />
					Nueva cita
				</Button>
			</div>

			<StatCards items={summary.stats} />

			<div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-5">
				<AgendaCard
					monthLabel={formatMonthYear(effectiveWeekStart)}
					weekDays={weekDays}
					selectedDate={effectiveSelectedDate}
					dayTitle={formatLongDate(effectiveSelectedDate)}
					slots={daySlots}
					isLoading={isAgendaLoading}
					isError={isAgendaError}
					onRetry={() => refetchAgenda()}
					onAgendar={setSelectedSlot}
					onSelectDate={setSelectedDate}
					onPrevWeek={() => {
						const nextStart = addDays(effectiveWeekStart, -7);
						setWeekStart(nextStart);
						setSelectedDate(nextStart);
					}}
					onNextWeek={() => {
						const nextStart = addDays(effectiveWeekStart, 7);
						setWeekStart(nextStart);
						setSelectedDate(nextStart);
					}}
				/>
				<div className="flex flex-col gap-4">
					<AttentionCard
						items={summary.attentionItems}
						onVerPendientes={(item) => {
							// `useAgenda` exige lunes y `daySlotsFromApi` devuelve [] si el día
							// no pertenece a la semana cargada: hay que mover las dos cosas.
							setWeekStart(mondayOf(item.date));
							setSelectedDate(item.date);
							navigate("/agenda");
						}}
					/>
					<QuickAccessCard
						canCreate={Boolean(createTargetSlot)}
						onCreate={() => setSelectedSlot(createTargetSlot)}
					/>
				</div>
			</div>

			<SlotAndHours
				slot={summary.availableSlot}
				quote={summary.quote}
				onAgendar={setSelectedSlot}
			/>

			<RecentActivity
				items={filteredActivities}
				filter={activityFilter}
				onFilterChange={setActivityFilter}
			/>

			<CreateSessionDialog
				slot={selectedSlot}
				onOpenChange={(open) => {
					if (!open) setSelectedSlot(null);
				}}
			/>
		</div>
	);
}
