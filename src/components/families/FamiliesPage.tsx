import { ChevronRight, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useGuardians } from "@/data/queries/useGuardians";

function plural(count: number, one: string, many: string) {
	return `${count} ${count === 1 ? one : many}`;
}

function FamiliesSkeleton() {
	return (
		<div className="flex flex-col gap-3">
			{Array.from({ length: 4 }, (_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: placeholders estáticos
				<Skeleton key={i} className="h-20 rounded-2xl" />
			))}
		</div>
	);
}

/** Lista de apoderados con buscador. Cada fila lleva a su ficha (`/familias/:id`). */
export function FamiliesPage() {
	const [search, setSearch] = useState("");
	const [debounced, setDebounced] = useState("");

	useEffect(() => {
		const timeout = setTimeout(() => setDebounced(search), 300);
		return () => clearTimeout(timeout);
	}, [search]);

	const { data, isPending, isError, refetch } = useGuardians(debounced);
	const guardians = data?.guardians ?? [];
	const searching = debounced.trim() !== "";

	return (
		<div className="mx-auto flex w-full max-w-4xl flex-col gap-6 lg:gap-8">
			<div>
				<p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">
					Panel
				</p>
				<h1 className="mt-1 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
					Familias
				</h1>
				<p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
					Apoderados, sus niños y la ficha clínica de cada uno.
				</p>
			</div>

			<div className="relative">
				<Search
					aria-hidden="true"
					className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					type="search"
					aria-label="Buscar familia"
					placeholder="Buscar por nombre o correo"
					className="h-10 pl-9"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</div>

			{isPending && <FamiliesSkeleton />}

			{isError && (
				<div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
					<p className="font-semibold text-foreground">
						No se pudieron cargar las familias
					</p>
					<p className="mt-1 text-sm text-muted-foreground">
						Revisa la conexión o intenta de nuevo.
					</p>
					<Button type="button" className="mt-4" onClick={() => refetch()}>
						Reintentar
					</Button>
				</div>
			)}

			{!isPending && !isError && guardians.length === 0 && (
				<div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
					<p className="font-medium text-foreground">
						{searching
							? `Sin resultados para “${debounced.trim()}”`
							: "Aún no hay familias registradas"}
					</p>
					{!searching && (
						<p className="mt-1 text-sm text-muted-foreground">
							Aparecen aquí cuando un apoderado reserva o cuando creas una cita.
						</p>
					)}
				</div>
			)}

			{guardians.length > 0 && (
				<ul className="flex flex-col gap-3">
					{guardians.map((guardian) => (
						<li key={guardian.id}>
							<Link
								to={`/familias/${guardian.id}`}
								className="flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-4 shadow-sm transition hover:border-primary/40 hover:bg-secondary/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
							>
								<div className="min-w-0 flex-1">
									<p className="truncate font-semibold text-foreground">
										{guardian.name}
									</p>
									<p className="truncate text-sm text-muted-foreground">
										{guardian.email} · {guardian.phone}
									</p>
								</div>
								<div className="hidden shrink-0 gap-2 sm:flex">
									<Badge variant="secondary">
										{plural(guardian.childrenCount, "niño", "niños")}
									</Badge>
									{guardian.activeSessions > 0 && (
										<Badge variant="outline">
											{plural(
												guardian.activeSessions,
												"sesión activa",
												"sesiones activas",
											)}
										</Badge>
									)}
								</div>
								<ChevronRight
									aria-hidden="true"
									className="size-4 shrink-0 text-muted-foreground"
								/>
							</Link>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
