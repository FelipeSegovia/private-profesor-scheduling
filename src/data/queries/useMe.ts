import { useQuery } from "@tanstack/react-query";
import { panelMe } from "@/lib/api/panel";
import { queryKeys } from "@/lib/api/queryKeys";
import { useAuthStore } from "@/store/authStore";

/** Valida el token guardado contra el backend antes de mostrar el panel. */
export function useMe() {
	const token = useAuthStore((state) => state.token);
	return useQuery({
		queryKey: queryKeys.me(),
		queryFn: panelMe,
		enabled: Boolean(token),
		retry: false,
	});
}
