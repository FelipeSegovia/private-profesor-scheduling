import { Outlet, useLocation } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import { initialsFrom } from "@/data/adapters/summary";
import type { Educator } from "@/data/dashboard";
import { usePanelEvents } from "@/data/queries/usePanelEvents";
import { useAuthStore } from "@/store/authStore";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

const breadcrumbByPath: Record<string, string> = {
	"/": "Resumen",
	"/agenda": "Mi agenda",
	"/preferencias": "Preferencias",
};

export function AppShell() {
	// Una sola conexión al stream de avisos por pestaña: el shell solo existe con sesión.
	usePanelEvents();
	const location = useLocation();
	const profile = useAuthStore((state) => state.educator);
	const breadcrumbCurrent = breadcrumbByPath[location.pathname] ?? "Resumen";

	// `RequireAuth` ya garantiza que haya un perfil antes de montar este shell.
	const educator: Educator = profile
		? {
				firstName: profile.name.trim().split(/\s+/)[0] ?? profile.name,
				fullName: profile.name,
				role: "Educadora diferencial",
				initials: initialsFrom(profile.name),
			}
		: {
				firstName: "",
				fullName: "",
				role: "Educadora diferencial",
				initials: "",
			};

	return (
		<div className="flex min-h-svh flex-col bg-background lg:flex-row">
			<Sidebar educator={educator} />
			<div className="flex min-w-0 flex-1 flex-col">
				<TopBar educator={educator} breadcrumbCurrent={breadcrumbCurrent} />
				<main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
					<Outlet />
				</main>
			</div>
			<Toaster position="bottom-right" duration={6000} />
		</div>
	);
}
