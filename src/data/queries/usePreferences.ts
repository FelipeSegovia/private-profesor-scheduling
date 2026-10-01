import { useQuery } from "@tanstack/react-query";
import { fetchPreferences } from "@/lib/api/panel";
import { queryKeys } from "@/lib/api/queryKeys";

export function usePreferences() {
	return useQuery({
		queryKey: queryKeys.preferences(),
		queryFn: fetchPreferences,
	});
}
