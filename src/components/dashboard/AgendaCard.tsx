import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { SlotRow } from "@/components/shared/SlotRow";
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
import { type DaySlot, daySummaryLabel } from "@/data/agenda";
import type { WeekDay } from "@/data/dashboard";
import { cn } from "@/lib/utils";

interface AgendaCardProps {
	monthLabel: string;
	weekDays: WeekDay[];
	selectedDate: string;
	dayTitle: string;
	slots: DaySlot[];
	isLoading: boolean;
	isError: boolean;
	onRetry: () => void;
	onAgendar: (slot: DaySlot) => void;
	onSelectDate: (date: string) => void;
	onPrevWeek: () => void;
	onNextWeek: () => void;
}

function SlotList({
	slots,
	isLoading,
	isError,
	onRetry,
	onAgendar,
}: Pick<
	AgendaCardProps,
	"slots" | "isLoading" | "isError" | "onRetry" | "onAgendar"
>) {
	if (isLoading) {
		return (
			<div className="flex flex-col gap-3">
				{Array.from({ length: 3 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: lista estática de placeholders, nunca se reordena
					<Skeleton key={i} className="h-16 rounded-xl" />
				))}
			</div>
		);
	}

	if (isError) {
		return (
			<div className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center">
				<p className="text-sm font-medium text-foreground">
					No se pudo cargar la agenda
				</p>
				<Button
					type="button"
					variant="outline"
					className="mt-3"
					onClick={onRetry}
				>
					Reintentar
				</Button>
			</div>
		);
	}

	if (slots.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center">
				<p className="text-sm font-medium text-foreground">
					No hay cupos este día
				</p>
				<p className="mt-1 text-sm text-muted-foreground">
					La plantilla semanal no incluye horarios para este día.
				</p>
			</div>
		);
	}

	return (
		<ul className="flex flex-col gap-3">
			{slots.map((slot) => (
				<SlotRow key={slot.id} slot={slot} onAgendar={onAgendar} />
			))}
		</ul>
	);
}

export function AgendaCard({
	monthLabel,
	weekDays,
	selectedDate,
	dayTitle,
	slots,
	isLoading,
	isError,
	onRetry,
	onAgendar,
	onSelectDate,
	onPrevWeek,
	onNextWeek,
}: AgendaCardProps) {
	return (
		<Card className="rounded-2xl shadow-sm ring-border">
			<CardHeader>
				<CardTitle className="font-serif text-2xl tracking-tight">
					Mi agenda
				</CardTitle>
				<CardDescription>Revisa tus próximas sesiones</CardDescription>
				<CardAction>
					<Button
						variant="link"
						className="h-auto px-0 text-primary"
						nativeButton={false}
						render={<Link to="/agenda" />}
					>
						Ver agenda completa →
					</Button>
				</CardAction>
			</CardHeader>

			<CardContent className="flex flex-col gap-5">
				<div className="flex items-center justify-between gap-2">
					<Button
						type="button"
						variant="ghost"
						size="icon-lg"
						aria-label="Semana anterior"
						onClick={onPrevWeek}
					>
						<ChevronLeft className="size-5" />
					</Button>
					<p className="text-sm font-semibold text-foreground">{monthLabel}</p>
					<Button
						type="button"
						variant="ghost"
						size="icon-lg"
						aria-label="Semana siguiente"
						onClick={onNextWeek}
					>
						<ChevronRight className="size-5" />
					</Button>
				</div>

				<div className="grid grid-cols-7 gap-1.5 sm:gap-2">
					{weekDays.map((day) => {
						const selected = day.date === selectedDate;
						return (
							<button
								key={day.date}
								type="button"
								onClick={() => onSelectDate(day.date)}
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
						<h3 className="text-base font-semibold text-foreground">
							{dayTitle}
						</h3>
						<p className="text-sm text-muted-foreground">
							{isLoading ? "Cargando cupos…" : daySummaryLabel(slots)}
						</p>
					</div>
					<Badge variant="secondary" className="text-primary">
						Hora de Chile
					</Badge>
				</div>

				<SlotList
					slots={slots}
					isLoading={isLoading}
					isError={isError}
					onRetry={onRetry}
					onAgendar={onAgendar}
				/>
			</CardContent>
		</Card>
	);
}
