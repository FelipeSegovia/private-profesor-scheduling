import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdatePreferencesBody } from "@/data/api-types";
import { updatePreferences } from "@/lib/api/panel";
import { queryKeys } from "@/lib/api/queryKeys";

export function useUpdatePreferences() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (body: UpdatePreferencesBody) => updatePreferences(body),
		onSuccess: (preferences) => {
			queryClient.setQueryData(queryKeys.preferences(), preferences);
			// El horizonte cambia qué cupos son `BEYOND_HORIZON` y el plazo, los pendientes.
			queryClient.invalidateQueries({ queryKey: ["agenda"] });
			queryClient.invalidateQueries({ queryKey: ["summary"] });
		},
	});
}
