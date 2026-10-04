import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateNoteBody, UpdateNoteBody } from "@/data/api-types";
import { createChildNote, deleteNote, updateNote } from "@/lib/api/panel";
import { queryKeys } from "@/lib/api/queryKeys";

/**
 * Crear, editar o borrar un registro refresca la lista del niño y el detalle
 * del apoderado (por `notesCount`). No toca agenda ni resumen: un registro no
 * cambia ninguna sesión.
 */
function useInvalidateNotes(childId: string, guardianId: string) {
	const queryClient = useQueryClient();
	return () =>
		Promise.all([
			queryClient.invalidateQueries({
				queryKey: queryKeys.childNotes(childId),
			}),
			queryClient.invalidateQueries({
				queryKey: queryKeys.guardian(guardianId),
			}),
		]);
}

export function useCreateNote(childId: string, guardianId: string) {
	const invalidate = useInvalidateNotes(childId, guardianId);
	return useMutation({
		mutationFn: (body: CreateNoteBody) => createChildNote(childId, body),
		onSuccess: invalidate,
	});
}

export function useUpdateNote(childId: string, guardianId: string) {
	const invalidate = useInvalidateNotes(childId, guardianId);
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body: UpdateNoteBody }) =>
			updateNote(id, body),
		onSuccess: invalidate,
	});
}

export function useDeleteNote(childId: string, guardianId: string) {
	const invalidate = useInvalidateNotes(childId, guardianId);
	return useMutation({
		mutationFn: (id: string) => deleteNote(id),
		onSuccess: invalidate,
		// Otra pestaña ya lo borró: la lista tiene que reflejarlo igual.
		onError: invalidate,
	});
}
