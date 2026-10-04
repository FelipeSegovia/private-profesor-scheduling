import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { STATUS_MAP } from "@/data/adapters/summary";
import type {
	ClinicalNoteDto,
	PanelChildDto,
	PanelGuardianDto,
	PanelSessionDto,
} from "@/data/api-types";
import { formatLongDate, todayChileYmd } from "@/data/dashboard";
import { useCreateNote, useUpdateNote } from "@/data/queries/useNoteMutations";
import { ApiError } from "@/lib/api/client";

const TITLE_MAX = 120;
const BODY_MAX = 10_000;

interface NoteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** `null` = registro nuevo. */
	note: ClinicalNoteDto | null;
	child: PanelChildDto;
	guardian: PanelGuardianDto;
	/** Sesiones de este niño, para vincular el registro a una. */
	sessions: PanelSessionDto[];
}

interface Errors {
	date?: string;
	title?: string;
	body?: string;
}

function validate(values: {
	date: string;
	title: string;
	body: string;
}): Errors {
	const errors: Errors = {};
	if (!values.date) errors.date = "La fecha es obligatoria.";
	const title = values.title.trim();
	if (!title) errors.title = "El título es obligatorio.";
	else if (title.length > TITLE_MAX) {
		errors.title = `El título no puede pasar de ${TITLE_MAX} caracteres.`;
	}
	const body = values.body.trim();
	if (!body) errors.body = "El texto es obligatorio.";
	else if (body.length > BODY_MAX) {
		errors.body = "El texto es demasiado largo.";
	}
	return errors;
}

function submitErrorMessage(error: unknown): string {
	if (error instanceof ApiError) return error.message;
	return "No se pudo guardar el registro. Intenta de nuevo.";
}

/**
 * Crear (`note === null`) o editar un registro. El padre remonta este
 * componente en cada apertura (`key`), así el formulario siempre parte limpio.
 */
export function NoteDialog({
	open,
	onOpenChange,
	note,
	child,
	guardian,
	sessions,
}: NoteDialogProps) {
	const editing = note !== null;
	const [date, setDate] = useState(note?.date ?? todayChileYmd());
	const [title, setTitle] = useState(note?.title ?? "");
	const [body, setBody] = useState(note?.body ?? "");
	const [sessionId, setSessionId] = useState(note?.sessionId ?? "");
	const [notifyGuardian, setNotifyGuardian] = useState(true);
	const [submitted, setSubmitted] = useState(false);

	const create = useCreateNote(child.id, guardian.id);
	const update = useUpdateNote(child.id, guardian.id);
	const mutation = editing ? update : create;

	const errors = validate({ date, title, body });
	const visible = submitted ? errors : {};

	function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		setSubmitted(true);
		if (Object.keys(errors).length > 0) return;

		const common = { date, title: title.trim(), body: body.trim() };
		if (note) {
			update.mutate(
				{ id: note.id, body: { ...common, sessionId: sessionId || null } },
				{
					onSuccess: () => {
						toast.success("Registro actualizado");
						onOpenChange(false);
					},
				},
			);
			return;
		}
		create.mutate(
			{ ...common, sessionId: sessionId || undefined, notifyGuardian },
			{
				onSuccess: () => {
					toast.success(
						notifyGuardian
							? `Registro guardado y enviado a ${guardian.email}`
							: "Registro guardado",
					);
					onOpenChange(false);
				},
			},
		);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<form onSubmit={handleSubmit} noValidate className="contents">
					<DialogHeader>
						<DialogTitle>
							{editing ? "Editar registro" : "Nuevo registro"}
						</DialogTitle>
						<DialogDescription>Ficha de {child.name}</DialogDescription>
					</DialogHeader>

					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="note-date">Fecha</Label>
							<Input
								id="note-date"
								type="date"
								value={date}
								aria-invalid={Boolean(visible.date)}
								onChange={(e) => setDate(e.target.value)}
							/>
							{visible.date && (
								<p className="text-xs text-destructive">{visible.date}</p>
							)}
						</div>

						<div className="flex flex-col gap-1.5">
							<Label htmlFor="note-title">Título</Label>
							<Input
								id="note-title"
								value={title}
								maxLength={TITLE_MAX}
								placeholder="Ej.: Lectura de sílabas trabadas"
								aria-invalid={Boolean(visible.title)}
								onChange={(e) => setTitle(e.target.value)}
							/>
							{visible.title && (
								<p className="text-xs text-destructive">{visible.title}</p>
							)}
						</div>

						<div className="flex flex-col gap-1.5">
							<Label htmlFor="note-body">Texto</Label>
							<Textarea
								id="note-body"
								rows={8}
								value={body}
								maxLength={BODY_MAX}
								placeholder="Qué trabajaron y qué observaste"
								aria-invalid={Boolean(visible.body)}
								onChange={(e) => setBody(e.target.value)}
							/>
							{visible.body && (
								<p className="text-xs text-destructive">{visible.body}</p>
							)}
						</div>

						<div className="flex flex-col gap-1.5">
							<Label htmlFor="note-session">Sesión (opcional)</Label>
							<Select
								id="note-session"
								value={sessionId}
								onChange={(e) => setSessionId(e.target.value)}
							>
								<option value="">Ninguna</option>
								{sessions.map((session) => (
									<option key={session.id} value={session.id}>
										{formatLongDate(session.date)} · {session.time} ·{" "}
										{STATUS_MAP[session.status]}
									</option>
								))}
							</Select>
						</div>

						{editing ? (
							<p className="text-xs text-muted-foreground">
								Editar el registro no vuelve a enviar el correo al apoderado.
							</p>
						) : (
							<div className="flex items-start gap-2.5 rounded-lg bg-secondary/60 p-3">
								<Checkbox
									id="note-notify"
									checked={notifyGuardian}
									onCheckedChange={(checked) => setNotifyGuardian(checked)}
									className="mt-0.5"
								/>
								<Label
									htmlFor="note-notify"
									className="flex-col items-start gap-0.5 leading-snug font-normal"
								>
									<span className="font-medium">
										Enviar este registro a {guardian.name} por correo
									</span>
									<span className="text-xs text-muted-foreground">
										{guardian.email} · El correo lleva la fecha, el título y el
										texto completos.
									</span>
								</Label>
							</div>
						)}

						{mutation.isError && (
							<p role="alert" className="text-sm text-destructive">
								{submitErrorMessage(mutation.error)}
							</p>
						)}
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={mutation.isPending}>
							{mutation.isPending
								? "Guardando…"
								: editing
									? "Guardar cambios"
									: "Guardar registro"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
