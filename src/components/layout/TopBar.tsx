import { Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Educator } from "@/data/dashboard";
import { NotificationsBell } from "./NotificationsBell";

interface TopBarProps {
	educator: Educator;
	breadcrumbCurrent?: string;
}

export function TopBar({
	educator,
	breadcrumbCurrent = "Resumen",
}: TopBarProps) {
	return (
		<header className="flex items-center justify-between gap-4 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm sm:px-6 lg:px-8">
			<nav aria-label="Miga de pan" className="min-w-0 text-sm">
				<ol className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
					<li className="truncate">Panel de educadora</li>
					<li aria-hidden="true" className="text-border">
						/
					</li>
					<li className="truncate font-semibold text-foreground">
						{breadcrumbCurrent}
					</li>
				</ol>
			</nav>

			<div className="flex shrink-0 items-center gap-1 sm:gap-2">
				<Button type="button" variant="ghost" size="icon" aria-label="Buscar">
					<Search className="size-4" />
				</Button>
				<NotificationsBell />
				<Avatar className="ml-1 bg-primary text-primary-foreground after:border-transparent">
					<AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
						{educator.initials}
					</AvatarFallback>
				</Avatar>
			</div>
		</header>
	);
}
