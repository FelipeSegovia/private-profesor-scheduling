import { useQuery } from "@tanstack/react-query";
import { listChildNotes } from "@/lib/api/panel";
import { queryKeys } from "@/lib/api/queryKeys";

/** Registros de la ficha clínica de un niño (el más reciente primero). */
export function useChildNotes(childId: string | null) {
	return useQuery({
		queryKey: queryKeys.childNotes(childId ?? ""),
		queryFn: () => listChildNotes(childId as string),
		enabled: Boolean(childId),
	});
}
