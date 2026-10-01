import { useQuery } from "@tanstack/react-query";
import { summaryFromApi } from "@/data/adapters/summary";
import { fetchSummary } from "@/lib/api/panel";
import { queryKeys } from "@/lib/api/queryKeys";

export function useSummary(date?: string) {
	return useQuery({
		queryKey: queryKeys.summary(date),
		queryFn: async () => summaryFromApi(await fetchSummary(date)),
	});
}
