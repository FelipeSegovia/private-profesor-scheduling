import { Download, Loader2, Mail, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_MAP } from "@/data/adapters/summary";
import type {
	ClinicalNoteDto,
	PanelChildDto,
	PanelGuardianDto,
	PanelSessionDto,
} from "@/data/api-types";
import { formatLongDate, formatLongDateWithYear } from "@/data/dashboard";
import { useChildNotes } from "@/data/queries/useChildNotes";
import { useExportNotesPdf } from "@/data/queries/useExportNotesPdf";
import { ApiError } from "@/lib/api/client";
import { DeleteNoteDialog } from "./DeleteNoteDialog";
import { NoteDialog } from "./NoteDialog";

const RECENT_SESSIONS = 5;

interface ChildRecordProps {
	child: PanelChildDto;
	guardian: PanelGuardianDto;
	/** Sesiones de este niño, la más reciente primero (vienen así del detalle del apoderado). */
	sessions: PanelSessionDto[];
}

interface DialogState {
	open: boolean;
	note: ClinicalNoteDto | null;
	/** Cambia en cada apertura: remonta el formulario y lo deja limpio. */
	nonce: number;
}

function NotesSkeleton() {
	return (
		<div className="flex flex-col gap-3">
			{Array.from({ length: 2 }, (_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: placeholders estáticos
				<Skeleton key={i} className="h-28 rounded-2xl" />
			))}
		</div>
	);
}

/** Contenido de una pestaña de niño: sus sesiones y su ficha clínica. */
export function ChildRecord({ child, guardian, sessions }: ChildRecordProps) {
	const { data, isPending, isError, refetch } = useChildNotes(child.id);
	const exportPdf = useExportNotesPdf(child.name);
	const [dialog, setDialog] = useState<DialogState>({
		open: false,
		note: null,
		nonce: 0,
	});
	const [deleting, setDeleting] = useState<ClinicalNoteDto | null>(null);

	const notes = data?.notes ?? [];

	function openDialog(note: ClinicalNoteDto | null) {
		setDialog((prev) => ({ open: true, note, nonce: prev.nonce + 1 }));
	}

	function handleExport() {
		exportPdf.mutate(child.id, {
			onError: (error) =>
				toast.error(
					error instanceof ApiError
						? error.message
						: "No se pudo exportar el PDF. Intenta de nuevo.",
				),
		});
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="font-serif text-2xl font-medium tracking-tight text-foreground">
						Ficha de {child.name}
					</h2>
					<p className="text-sm text-muted-foreground">{child.age} años</p>
				</div>
				<div className="flex gap-2">
					<Button
						type="button"
						variant="outline"
						disabled={exportPdf.isPending}
						onClick={handleExport}
					>
						{exportPdf.isPending ? (
							<Loader2 className="animate-spin" />
						) : (
							<Download />
						)}
						Exportar PDF
					</Button>
					<Button type="button" onClick={() => openDialog(null)}>
						<Plus />
						Nuevo registro
					</Button>
				</div>
			</div>

			<section aria-labelledby={`sessions-${child.id}`}>
				<h3
					id={`sessions-${child.id}`}
					className="mb-2 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase"
				>
					Sesiones
				</h3>
				{sessions.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						Aún no tiene sesiones.
					</p>
				) : (
					<ul className="divide-y divide-border rounded-2xl border border-border bg-card shadow-sm">
						{sessions.slice(0, RECENT_SESSIONS).map((session) => (
							<li
								key={session.id}
								className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
							>
								<span className="text-foreground">
									{formatLongDate(session.date)} · {session.time}
								</span>
								<StatusBadge status={STATUS_MAP[session.status]} />
							</li>
						))}
						{sessions.length > RECENT_SESSIONS && (
							<li className="px-4 py-2.5 text-xs text-muted-foreground">
								y {sessions.length - RECENT_SESSIONS} más
							</li>
						)}
					</ul>
				)}
			</section>

			<section aria-labelledby={`notes-${child.id}`}>
				<h3
					id={`notes-${child.id}`}
					className="mb-2 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase"
				>
					Registros
				</h3>

				{isPending && <NotesSkeleton />}

				{isError && (
					<div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
						<p className="font-semibold text-foreground">
							No se pudo cargar la ficha
						</p>
						<Button type="button" className="mt-3" onClick={() => refetch()}>
							Reintentar
						</Button>
					</div>
				)}

				{!isPending && !isError && notes.length === 0 && (
					<div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
						<p className="font-medium text-foreground">Aún no hay registros</p>
						<p className="mt-1 text-sm text-muted-foreground">
							Agrega el primero para empezar el historial de {child.name}.
						</p>
					</div>
				)}

				{notes.length > 0 && (
					<ul className="flex flex-col gap-3">
						{notes.map((note) => (
							<li key={note.id}>
								<article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0">
											<p className="text-xs font-semibold text-primary">
												{formatLongDateWithYear(note.date)}
											</p>
											<h4 className="mt-0.5 font-serif text-lg leading-snug font-medium text-foreground">
												{note.title}
											</h4>
											{note.session && (
												<p className="mt-0.5 text-xs text-muted-foreground">
													Sesión del {formatLongDate(note.session.date)},{" "}
													{note.session.time}
												</p>
											)}
										</div>
										<div className="flex shrink-0 gap-1">
											<Button
												type="button"
												variant="ghost"
												size="icon-sm"
												aria-label={`Editar el registro “${note.title}”`}
												onClick={() => openDialog(note)}
											>
												<Pencil />
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="icon-sm"
												aria-label={`Borrar el registro “${note.title}”`}
												onClick={() => setDeleting(note)}
											>
												<Trash2 />
											</Button>
										</div>
									</div>
									<p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
										{note.body}
									</p>
									{note.guardianNotified && (
										<Badge variant="secondary" className="mt-3 gap-1">
											<Mail aria-hidden="true" />
											Enviado al apoderado
										</Badge>
									)}
								</article>
							</li>
						))}
					</ul>
				)}
			</section>

			<NoteDialog
				key={dialog.nonce}
				open={dialog.open}
				onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
				note={dialog.note}
				child={child}
				guardian={guardian}
				sessions={sessions}
			/>
			<DeleteNoteDialog
				note={deleting}
				child={child}
				guardian={guardian}
				onClose={() => setDeleting(null)}
			/>
		</div>
	);
}
