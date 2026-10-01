import { useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { ActivityIcon } from "@/components/shared/ActivityIcon";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTitle,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	type NotificationView,
	notificationFromApi,
} from "@/data/adapters/notifications";
import { chileDateFromIso, mondayOf } from "@/data/dashboard";
import {
	useMarkNotificationsSeen,
	useNotifications,
} from "@/data/queries/useNotifications";
import { queryKeys } from "@/lib/api/queryKeys";
import { useAgendaViewStore } from "@/store/agendaViewStore";

function badgeLabel(count: number): string {
	return count > 9 ? "9+" : String(count);
}

/**
 * Campana de avisos del `TopBar`. Muestra la insignia con lo no leído; al
 * abrirla marca todo como visto (la insignia baja a 0 al instante) pero los
 * avisos que estaban sin leer siguen resaltados mientras la lista está abierta,
 * para que se vea cuáles eran nuevos.
 */
export function NotificationsBell() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data, isPending, isError } = useNotifications();
	const markSeen = useMarkNotificationsSeen();
	const setWeekStart = useAgendaViewStore((state) => state.setWeekStart);
	const setSelectedDate = useAgendaViewStore((state) => state.setSelectedDate);

	const [open, setOpen] = useState(false);
	// Ids que estaban sin leer al abrir: se resaltan mientras siga abierta.
	const [frozenUnread, setFrozenUnread] = useState<ReadonlySet<string>>(
		new Set(),
	);

	const unreadCount = data?.unreadCount ?? 0;
	const items = data?.items ?? [];
	const views = items.map((item) => notificationFromApi(item));

	function handleOpenChange(next: boolean) {
		setOpen(next);
		if (next) {
			setFrozenUnread(
				new Set(items.filter((item) => item.unread).map((item) => item.id)),
			);
			if (unreadCount > 0) markSeen.mutate();
			return;
		}

		// Llegó algo nuevo con la lista abierta (el backend lo trae como no leído):
		// se vuelve a marcar visto. Si no, solo se refresca desde el backend.
		const arrivedWhileOpen = items.some(
			(item) => item.unread && !frozenUnread.has(item.id),
		);
		setFrozenUnread(new Set());
		if (arrivedWhileOpen) markSeen.mutate();
		else queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
	}

	function openInAgenda(view: NotificationView) {
		const date = chileDateFromIso(view.startsAt);
		setWeekStart(mondayOf(date));
		setSelectedDate(date);
		handleOpenChange(false);
		navigate("/agenda");
	}

	return (
		<Popover open={open} onOpenChange={handleOpenChange}>
			<PopoverTrigger
				render={
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="relative"
						aria-label={
							unreadCount > 0
								? `Notificaciones, ${unreadCount} sin leer`
								: "Notificaciones"
						}
					/>
				}
			>
				<Bell className="size-4" />
				{unreadCount > 0 && (
					<span
						aria-hidden="true"
						className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-none font-semibold text-white ring-2 ring-background"
					>
						{badgeLabel(unreadCount)}
					</span>
				)}
			</PopoverTrigger>

			<PopoverContent align="end" className="w-80 gap-0 p-0">
				<PopoverTitle className="border-b border-border px-4 py-3 font-heading text-base">
					Avisos
				</PopoverTitle>

				<div className="max-h-96 overflow-y-auto">
					{isPending ? (
						<p className="px-4 py-6 text-center text-sm text-muted-foreground">
							Cargando avisos…
						</p>
					) : isError ? (
						<p className="px-4 py-6 text-center text-sm text-muted-foreground">
							No se pudieron cargar los avisos.
						</p>
					) : views.length === 0 ? (
						<p className="px-4 py-6 text-center text-sm text-muted-foreground">
							No hay avisos nuevos
						</p>
					) : (
						<ul>
							{views.map((view) => {
								const highlighted = frozenUnread.has(view.id) || view.unread;
								return (
									<li
										key={view.id}
										className="border-b border-border last:border-0"
									>
										<button
											type="button"
											onClick={() => openInAgenda(view)}
											className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none ${
												highlighted ? "bg-secondary/60" : ""
											}`}
										>
											<ActivityIcon kind={view.kind} />
											<span className="min-w-0 flex-1">
												<span className="block text-sm leading-snug text-foreground">
													{view.text}
												</span>
												<span className="mt-0.5 block text-xs text-muted-foreground">
													{view.relative}
												</span>
											</span>
											{highlighted && (
												<span
													role="img"
													aria-label="Sin leer"
													className="mt-1.5 size-2 shrink-0 rounded-full bg-destructive"
												/>
											)}
										</button>
									</li>
								);
							})}
						</ul>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
