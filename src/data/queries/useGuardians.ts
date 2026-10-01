import { useQuery } from "@tanstack/react-query";
import { listGuardians } from "@/lib/api/panel";
import { queryKeys } from "@/lib/api/queryKeys";

export function useGuardians(query: string) {
	const trimmed = query.trim();
	return useQuery({
		queryKey: queryKeys.guardians(trimmed || undefined),
		queryFn: () => listGuardians(trimmed || undefined),
	});
}
