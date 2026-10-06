import {
	CalendarDays,
	LayoutDashboard,
	LogOut,
	Settings,
	Users,
} from "lucide-react";
import { NavLink } from "react-router";
import logoIcon from "@/assets/icon_acompana.svg";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Educator } from "@/data/dashboard";
import { panelLogout } from "@/lib/api/panel";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const mainNav = [
	{ to: "/", label: "Resumen", icon: LayoutDashboard, end: true },
	{ to: "/agenda", label: "Mi agenda", icon: CalendarDays, end: false },
	{ to: "/familias", label: "Familias", icon: Users, end: false },
] as const;

const configNav = [
	{ to: "/preferencias", label: "Preferencias", icon: Settings },
] as const;

interface SidebarProps {
	educator: Educator;
}

export function Sidebar({ educator }: SidebarProps) {
	const logout = useAuthStore((state) => state.logout);

	return (
		<aside className="flex w-full flex-col gap-6 border-b border-border bg-sidebar px-4 py-5 lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
			<div className="flex items-center gap-2.5 px-1">
				<img src={logoIcon} alt="" className="size-8" />
				<span className="font-serif text-xl font-medium tracking-tight text-foreground">
					Acompaña
				</span>
			</div>

			<div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm">
				<Avatar
					size="lg"
					className="bg-primary text-primary-foreground after:border-transparent"
				>
					<AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
						{educator.initials}
					</AvatarFallback>
				</Avatar>
				<span className="min-w-0 flex-1 text-left">
					<span className="block truncate text-sm font-semibold text-foreground">
						{educator.fullName}
					</span>
					<span className="block truncate text-xs text-muted-foreground">
						{educator.role}
					</span>
				</span>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label="Cerrar sesión"
					onClick={() => {
						logout();
						void panelLogout().catch(() => {
							// Logout es idempotente del lado del servidor; la sesión
							// local ya se limpió aunque la llamada falle.
						});
					}}
				>
					<LogOut className="size-4" />
				</Button>
			</div>

			<nav className="flex flex-col gap-6">
				<div>
					<p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
						Menú principal
					</p>
					<ul className="flex flex-col gap-1">
						{mainNav.map((item) => {
							const Icon = item.icon;
							return (
								<li key={item.to}>
									<NavLink
										to={item.to}
										end={item.end}
										className={({ isActive }) =>
											cn(
												"flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
												isActive
													? "bg-secondary font-semibold text-primary"
													: "font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
											)
										}
									>
										{({ isActive }) => (
											<>
												<Icon
													className="size-4 shrink-0"
													strokeWidth={isActive ? 2.25 : 2}
												/>
												{item.label}
											</>
										)}
									</NavLink>
								</li>
							);
						})}
					</ul>
				</div>

				<div>
					<p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
						Configuración
					</p>
					<ul className="flex flex-col gap-1">
						{configNav.map((item) => {
							const Icon = item.icon;
							return (
								<li key={item.to}>
									<NavLink
										to={item.to}
										className={({ isActive }) =>
											cn(
												"flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
												isActive
													? "bg-secondary font-semibold text-primary"
													: "font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
											)
										}
									>
										<Icon className="size-4 shrink-0" />
										{item.label}
									</NavLink>
								</li>
							);
						})}
					</ul>
				</div>
			</nav>
		</aside>
	);
}
