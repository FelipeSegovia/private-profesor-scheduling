import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type {
	ClinicalNoteDto,
	PanelChildDto,
	PanelGuardianDto,
} from "@/data/api-types";
import { formatLongDateWithYear } from "@/data/dashboard";
import { useDeleteNote } from "@/data/queries/useNoteMutations";
import { ApiError } from "@/lib/api/client";

interface DeleteNoteDialogProps {
	/** `null` = cerrado. */
	note: ClinicalNoteDto | null;
	child: PanelChildDto;
	guardian: PanelGuardianDto;
	onClose: () => void;
}

/** Confirma el borrado, que es definitivo. */
export function DeleteNoteDialog({
	note,
	child,
	guardian,
	onClose,
}: DeleteNoteDialogProps) {
	const remove = useDeleteNote(child.id, guardian.id);

	function handleOpenChange(open: boolean) {
		if (open) return;
		remove.reset();
		onClose();
	}

	function handleConfirm() {
		if (!note) return;
		remove.mutate(note.id, {
			onSuccess: () => {
				toast.success("Registro borrado");
				handleOpenChange(false);
			},
		});
	}

	return (
		<Dialog open={note !== null} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>¿Borrar este registro?</DialogTitle>
					{note && (
						<DialogDescription>
							“{note.title}” del {formatLongDateWithYear(note.date)}. Esto no se
							puede deshacer.
						</DialogDescription>
					)}
				</DialogHeader>

				{note?.guardianNotified && (
					<p className="rounded-lg bg-secondary/60 p-3 text-sm text-foreground">
						Este registro ya se envió por correo a {guardian.email}: el
						apoderado conservará ese correo aunque lo borres.
					</p>
				)}

				{remove.isError && (
					<p role="alert" className="text-sm text-destructive">
						{remove.error instanceof ApiError
							? remove.error.message
							: "No se pudo borrar el registro. Intenta de nuevo."}
					</p>
				)}

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => handleOpenChange(false)}
					>
						Cancelar
					</Button>
					<Button
						type="button"
						variant="destructive"
						disabled={remove.isPending}
						onClick={handleConfirm}
					>
						{remove.isPending ? "Borrando…" : "Borrar registro"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
