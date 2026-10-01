import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateSessionBody } from "@/data/api-types";
import { ApiError } from "@/lib/api/client";
import { createSession } from "@/lib/api/panel";

export function useCreateSession() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (body: CreateSessionBody) => createSession(body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["agenda"] });
			queryClient.invalidateQueries({ queryKey: ["summary"] });
		},
		onError: (error) => {
			// SLOT_TAKEN: otra pestaña/proceso ya ocupó el cupo; refrescar para que la
			// educadora vea el estado real sin reintentar a ciegas.
			if (error instanceof ApiError && error.code === "SLOT_TAKEN") {
				queryClient.invalidateQueries({ queryKey: ["agenda"] });
			}
		},
	});
}
