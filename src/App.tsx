import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router";
import { AgendaPage } from "@/components/agenda/AgendaPage";
import { LoginPage } from "@/components/auth/LoginPage";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { AppShell } from "@/components/layout/AppShell";
import { PreferencesPage } from "@/components/preferences/PreferencesPage";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/data/queries/useMe";
import { useAuthStore } from "@/store/authStore";

function ShellFallback() {
	return (
		<div className="flex min-h-svh flex-col gap-4 bg-background p-6 lg:flex-row">
			<Skeleton className="h-64 w-full rounded-2xl lg:h-auto lg:w-64" />
			<div className="flex flex-1 flex-col gap-4">
				<Skeleton className="h-12 w-full rounded-xl" />
				<Skeleton className="h-40 w-full rounded-2xl" />
			</div>
		</div>
	);
}

/**
 * Sin token guardado: directo a /login. Con token: se valida contra
 * `GET /api/panel/auth/me` antes de mostrar nada — si el token venció o
 * quedó inválido (clave cambiada), el cliente HTTP ya limpió la sesión
 * (ver `src/lib/api/client.ts`) y acá se refleja mandando a /login.
 */
function RequireAuth({ children }: { children: React.ReactNode }) {
	const token = useAuthStore((state) => state.token);
	const educator = useAuthStore((state) => state.educator);
	const setEducator = useAuthStore((state) => state.setEducator);
	const { data, isPending, isError } = useMe();

	useEffect(() => {
		if (data && data.id !== educator?.id) {
			setEducator(data);
		}
	}, [data, educator?.id, setEducator]);

	if (!token) {
		return <Navigate to="/login" replace />;
	}

	if (isPending && !educator) {
		return <ShellFallback />;
	}

	if (isError) {
		return <Navigate to="/login" replace />;
	}

	return children;
}

function App() {
	const token = useAuthStore((state) => state.token);

	return (
		<Routes>
			<Route
				path="/login"
				element={token ? <Navigate to="/" replace /> : <LoginPage />}
			/>
			<Route
				element={
					<RequireAuth>
						<AppShell />
					</RequireAuth>
				}
			>
				<Route index element={<DashboardPage />} />
				<Route path="agenda" element={<AgendaPage />} />
				<Route path="preferencias" element={<PreferencesPage />} />
				<Route path="*" element={<Navigate to="/" replace />} />
			</Route>
		</Routes>
	);
}

export default App;
