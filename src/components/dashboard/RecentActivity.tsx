import { ActivityIcon } from "@/components/shared/ActivityIcon";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ActivityItem } from "@/data/dashboard";

export type ActivityFilter = "todas" | "reservas" | "cambios";

interface RecentActivityProps {
	items: ActivityItem[];
	filter: ActivityFilter;
	onFilterChange: (filter: ActivityFilter) => void;
}

export function RecentActivity({
	items,
	filter,
	onFilterChange,
}: RecentActivityProps) {
	return (
		<Card className="rounded-2xl shadow-sm ring-border">
			<CardHeader className="sm:flex-row sm:items-start sm:justify-between">
				<div>
					<CardTitle className="font-serif text-2xl tracking-tight">
						Actividad reciente
					</CardTitle>
					<CardDescription>Últimos movimientos en tu agenda</CardDescription>
				</div>

				<Tabs
					value={filter}
					onValueChange={(value) => {
						if (
							value === "todas" ||
							value === "reservas" ||
							value === "cambios"
						) {
							onFilterChange(value);
						}
					}}
				>
					<TabsList aria-label="Filtrar actividad" className="bg-background">
						<TabsTrigger
							value="todas"
							className="data-active:bg-secondary data-active:text-primary"
						>
							Todas
						</TabsTrigger>
						<TabsTrigger
							value="reservas"
							className="data-active:bg-secondary data-active:text-primary"
						>
							Reservas
						</TabsTrigger>
						<TabsTrigger
							value="cambios"
							className="data-active:bg-secondary data-active:text-primary"
						>
							Cambios
						</TabsTrigger>
					</TabsList>
				</Tabs>
			</CardHeader>

			<CardContent>
				{items.length === 0 ? (
					<p className="py-6 text-center text-sm text-muted-foreground">
						No hay movimientos en este filtro.
					</p>
				) : (
					<ul>
						{items.map((item, index) => (
							<li key={item.id}>
								{index > 0 ? <Separator /> : null}
								<div className="flex flex-wrap items-center gap-3 py-4 first:pt-0 last:pb-0 sm:flex-nowrap sm:gap-4">
									<ActivityIcon kind={item.kind} />
									<div className="min-w-0 flex-1">
										<p className="text-sm font-semibold text-foreground">
											{item.title}
										</p>
										<p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
											{item.meta}
										</p>
									</div>
									<Badge variant="secondary" className="text-primary">
										{item.badge}
									</Badge>
								</div>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}
