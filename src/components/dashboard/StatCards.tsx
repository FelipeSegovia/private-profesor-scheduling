import {
	CalendarDays,
	CheckCircle2,
	Clock,
	type LucideIcon,
	Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { StatCard } from "@/data/dashboard";

const icons: Record<StatCard["icon"], LucideIcon> = {
	calendar: CalendarDays,
	check: CheckCircle2,
	clock: Clock,
	users: Users,
};

interface StatCardsProps {
	items: StatCard[];
}

export function StatCards({ items }: StatCardsProps) {
	return (
		<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
			{items.map((item) => {
				const Icon = icons[item.icon];
				return (
					<Card key={item.id} className="rounded-2xl shadow-sm ring-border">
						<CardContent className="pt-0">
							<div className="mb-3 flex items-start justify-between gap-2">
								<p className="text-sm font-medium text-muted-foreground">
									{item.label}
								</p>
								<span className="flex size-9 items-center justify-center rounded-full bg-secondary text-primary">
									<Icon className="size-4" />
								</span>
							</div>
							<p className="font-serif text-3xl font-medium tracking-tight text-foreground">
								{item.value}
							</p>
							<p className="mt-1 text-sm text-muted-foreground">{item.hint}</p>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
