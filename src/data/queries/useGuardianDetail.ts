import { useQuery } from "@tanstack/react-query";
import { getGuardian } from "@/lib/api/panel";
import { queryKeys } from "@/lib/api/queryKeys";

export function useGuardianDetail(id: string | null) {
	return useQuery({
		queryKey: queryKeys.guardian(id ?? ""),
		queryFn: () => getGuardian(id as string),
		enabled: Boolean(id),
	});
}
