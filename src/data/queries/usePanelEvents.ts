import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { toastMessageFor } from "@/data/adapters/notifications";
import type { SessionEvent } from "@/data/api-types";
import { subscribeSse } from "@/lib/api/sse";

/**
 * Mantiene abierto el stream de avisos (`GET /api/panel/events`) y reacciona a
 * cada cambio de sesión: refresca resumen, agenda y campana, y avisa con un
 * toast si no lo hizo la propia educadora. Se monta una sola vez, en
 * `AppShell` (que solo existe con sesión iniciada): al cerrar sesión se
 * desmonta y aborta la conexión.
 */
export function usePanelEvents() {
	const queryClient = useQueryClient();

	useEffect(() => {
		const controller = new AbortController();
		const invalidate = (...keys: string[]) => {
			for (const key of keys) {
				queryClient.invalidateQueries({ queryKey: [key] });
			}
		};

		function handleSessionEvent(event: SessionEvent) {
			// Cualquier actor: otra pestaña de la misma educadora también se refresca.
			invalidate("summary", "agenda", "notifications");
			// Una reserva pública puede crear apoderado y niño.
			if (event.kind === "CREATED") invalidate("guardians", "guardian");

			const message = toastMessageFor(event);
			if (message) toast(message);
		}

		void subscribeSse("/api/panel/events", {
			signal: controller.signal,
			// El stream no repite lo perdido: al reconectar hay que volver a pedir todo.
			onOpen: (opened) => {
				if (opened > 0) {
					invalidate(
						"summary",
						"agenda",
						"notifications",
						"guardians",
						"guardian",
					);
				}
			},
			onEvent: (message) => {
				if (message.event !== "session") return;
				let event: SessionEvent;
				try {
					event = JSON.parse(message.data) as SessionEvent;
				} catch {
					return; // mensaje mal formado: se ignora, el stream sigue
				}
				handleSessionEvent(event);
			},
		});

		return () => controller.abort();
	}, [queryClient]);
}
