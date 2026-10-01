import { useQuery } from "@tanstack/react-query";
import { fetchAgenda } from "@/lib/api/panel";
import { queryKeys } from "@/lib/api/queryKeys";

export function useAgenda(weekStart: string) {
	return useQuery({
		queryKey: queryKeys.agenda(weekStart),
		queryFn: () => fetchAgenda(weekStart),
		enabled: Boolean(weekStart),
	});
}
