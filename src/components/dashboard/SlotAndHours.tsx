import { ArrowRight, Clock, Plus, Quote } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	type AvailableSlot,
	formatLongDate,
	type Quote as QuoteData,
} from "@/data/dashboard";

interface SlotAndHoursProps {
	slot: AvailableSlot | null;
	quote: QuoteData;
	onAgendar: (slot: AvailableSlot) => void;
}

export function SlotAndHours({ slot, quote, onAgendar }: SlotAndHoursProps) {
	return (
		<div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
			<Card className="rounded-2xl shadow-sm ring-border">
				<CardContent>
					{slot ? (
						<div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-brand-selected bg-background px-4 py-4 sm:flex-nowrap">
							<p className="w-14 shrink-0 text-lg font-bold text-primary">
								{slot.time}
							</p>
							<div className="min-w-0 flex-1">
								<p className="text-sm font-semibold text-primary">
									{slot.title}
								</p>
								<p className="text-xs text-muted-foreground">
									{formatLongDate(slot.date)} · {slot.hint}
								</p>
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
						</div>
					) : (
						<div className="rounded-xl border border-dashed border-border bg-background px-4 py-4 text-center">
							<p className="text-sm font-semibold text-foreground">
								Sin cupos libres esta semana
							</p>
							<p className="text-xs text-muted-foreground">
								Revisa la agenda completa o la semana siguiente.
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			<div className="flex flex-col gap-4">
				<Button
					variant="outline"
					className="h-auto justify-start gap-3 rounded-2xl border-border bg-card px-4 py-4 text-left shadow-sm hover:bg-secondary"
					nativeButton={false}
					render={<Link to="/preferencias" />}
				>
					<span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
						<Clock className="size-5" />
					</span>
					<span className="min-w-0 flex-1">
						<span className="block text-sm font-semibold text-foreground">
							Editar mis horarios
						</span>
						<span className="block text-xs font-normal text-muted-foreground">
							Define tus cupos disponibles
						</span>
					</span>
					<ArrowRight className="size-4 shrink-0 text-muted-foreground" />
				</Button>

				<blockquote className="relative overflow-hidden rounded-2xl bg-primary px-5 py-5 text-primary-foreground shadow-sm">
					<Quote className="mb-3 size-5 opacity-80" />
					<p className="font-serif text-lg leading-snug font-medium">
						{quote.text}
					</p>
					<footer className="mt-4 text-sm opacity-80">
						— {quote.attribution}
					</footer>
				</blockquote>
			</div>
		</div>
	);
}
