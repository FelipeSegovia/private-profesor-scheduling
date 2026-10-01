import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
	PanelPreferencesResponse,
	UpdateTemplateBody,
} from "@/data/api-types";
import { updateTemplate } from "@/lib/api/panel";
import { queryKeys } from "@/lib/api/queryKeys";

export function useUpdateTemplate() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (body: UpdateTemplateBody) => updateTemplate(body),
		onSuccess: (result) => {
			queryClient.setQueryData<PanelPreferencesResponse>(
				queryKeys.preferences(),
				(current) =>
					current ? { ...current, workWeek: result.workWeek } : current,
			);
			queryClient.invalidateQueries({ queryKey: queryKeys.preferences() });
			queryClient.invalidateQueries({ queryKey: ["agenda"] });
			queryClient.invalidateQueries({ queryKey: ["summary"] });
		},
	});
}
