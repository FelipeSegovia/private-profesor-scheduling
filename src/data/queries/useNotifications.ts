import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PanelNotificationsResponse } from "@/data/api-types";
import { fetchNotifications, markNotificationsSeen } from "@/lib/api/panel";
import { queryKeys } from "@/lib/api/queryKeys";

/** Avisos de la campana. Se consulta desde que monta el shell para tener el contador. */
export function useNotifications() {
	return useQuery({
		queryKey: queryKeys.notifications(),
		queryFn: fetchNotifications,
	});
}

/**
 * Marca todo como visto. Optimista: la insignia baja a 0 al instante y, si el
 * backend falla, se restaura lo anterior. La campana conserva por su cuenta el
 * resaltado de lo que estaba sin leer mientras está abierta.
 */
export function useMarkNotificationsSeen() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: markNotificationsSeen,
		onMutate: async () => {
			const key = queryKeys.notifications();
			await queryClient.cancelQueries({ queryKey: key });
			const previous =
				queryClient.getQueryData<PanelNotificationsResponse>(key);
			if (previous) {
				queryClient.setQueryData<PanelNotificationsResponse>(key, {
					unreadCount: 0,
					items: previous.items.map((item) => ({ ...item, unread: false })),
				});
			}
			return { previous };
		},
		onError: (_error, _variables, context) => {
			if (context?.previous) {
				queryClient.setQueryData(queryKeys.notifications(), context.previous);
			}
		},
		// Siempre se vuelve a pedir: cubre el caso de una consulta que arrancó
		// justo antes de que el backend registrara el "visto".
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
		},
	});
}
