import { ArrowLeft, Mail, Phone } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGuardianDetail } from "@/data/queries/useGuardianDetail";
import { ApiError } from "@/lib/api/client";
import { ChildRecord } from "./ChildRecord";

function GuardianSkeleton() {
	return (
		<div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
			<Skeleton className="h-4 w-24" />
			<Skeleton className="h-10 w-64" />
			<Skeleton className="h-24 rounded-2xl" />
			<Skeleton className="h-64 rounded-2xl" />
		</div>
	);
}

/**
 * Ficha de un apoderado: sus datos y una pestaña por niño con su ficha
 * clínica. La pestaña activa vive en la URL (`?nino=<childId>`) para poder
 * recargar o enlazar; sin ese parámetro, o con uno que no es de este
 * apoderado, se muestra el primer niño.
 */
export function GuardianPage() {
	const { guardianId } = useParams();
	const [searchParams, setSearchParams] = useSearchParams();
	const { data, isPending, error, refetch } = useGuardianDetail(
		guardianId ?? null,
	);

	if (isPending) return <GuardianSkeleton />;

	if (error || !data) {
		const notFound =
			error instanceof ApiError && error.code === "GUARDIAN_NOT_FOUND";
		return (
			<div className="mx-auto max-w-4xl rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
				<p className="font-semibold text-foreground">
					{notFound
						? "No encontramos esa familia"
						: "No se pudo cargar la ficha"}
				</p>
				<p className="mt-1 text-sm text-muted-foreground">
					{notFound
						? "Puede que se haya movido o que el enlace esté mal."
						: "Revisa la conexión o intenta de nuevo."}
				</p>
				<div className="mt-4 flex justify-center gap-2">
					{!notFound && (
						<Button type="button" onClick={() => refetch()}>
							Reintentar
						</Button>
					)}
					<Button
						variant="outline"
						nativeButton={false}
						render={<Link to="/familias" />}
					>
						Volver a Familias
					</Button>
				</div>
			</div>
		);
	}

	const { guardian, children, sessions } = data;
	const requested = searchParams.get("nino");
	const activeChildId =
		children.find((child) => child.id === requested)?.id ?? children[0]?.id;

	return (
		<div className="mx-auto flex w-full max-w-4xl flex-col gap-6 lg:gap-8">
			<div>
				<Link
					to="/familias"
					className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
				>
					<ArrowLeft aria-hidden="true" className="size-4" />
					Familias
				</Link>
				<h1 className="mt-3 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
					{guardian.name}
				</h1>
				<div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
					<a
						href={`mailto:${guardian.email}`}
						className="inline-flex items-center gap-1.5 hover:text-foreground"
					>
						<Mail aria-hidden="true" className="size-4" />
						{guardian.email}
					</a>
					<a
						href={`tel:${guardian.phone}`}
						className="inline-flex items-center gap-1.5 hover:text-foreground"
					>
						<Phone aria-hidden="true" className="size-4" />
						{guardian.phone}
					</a>
				</div>
			</div>

			{children.length === 0 || !activeChildId ? (
				<div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
					<p className="font-medium text-foreground">
						Este apoderado aún no tiene niños registrados
					</p>
					<p className="mt-1 text-sm text-muted-foreground">
						Su ficha clínica aparece cuando haya un niño.
					</p>
				</div>
			) : (
				<Tabs
					value={activeChildId}
					onValueChange={(value) =>
						setSearchParams({ nino: String(value) }, { replace: true })
					}
				>
					<TabsList className="h-auto w-full flex-wrap justify-start">
						{children.map((child) => (
							<TabsTrigger
								key={child.id}
								value={child.id}
								className="flex-none px-3 py-1.5"
							>
								{child.name}
								<Badge variant="secondary" className="ml-1">
									{child.notesCount ?? 0}
								</Badge>
							</TabsTrigger>
						))}
					</TabsList>
					{children.map((child) => (
						<TabsContent key={child.id} value={child.id} className="mt-4">
							<ChildRecord
								child={child}
								guardian={guardian}
								sessions={sessions.filter((s) => s.childId === child.id)}
							/>
						</TabsContent>
					))}
				</Tabs>
			)}
		</div>
	);
}
