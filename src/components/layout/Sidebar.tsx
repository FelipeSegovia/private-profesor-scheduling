import { NavLink } from 'react-router'
import {
  CalendarDays,
  ChevronDown,
  Clock,
  History,
  LayoutDashboard,
  Settings,
  Users,
} from 'lucide-react'
import type { Educator } from '@/data/dashboard'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const mainNav = [
  { to: '/', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/agenda', label: 'Mi agenda', icon: CalendarDays, end: false },
  { to: '/familias', label: 'Familias', icon: Users, end: false },
  { to: '/historial', label: 'Historial', icon: History, end: false },
] as const

const configNav = [
  { to: '/horarios', label: 'Horarios', icon: Clock },
  { to: '/preferencias', label: 'Preferencias', icon: Settings },
] as const

interface SidebarProps {
  educator: Educator
}

export function Sidebar({ educator }: SidebarProps) {
  return (
    <aside className="flex w-full flex-col gap-6 border-b border-border bg-sidebar px-4 py-5 lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
      <div className="flex items-center gap-2.5 px-1">
        <span className="relative flex size-8 items-center justify-center rounded-full bg-primary">
          <span className="size-2 rounded-full bg-primary-foreground" />
        </span>
        <span className="font-serif text-xl font-medium tracking-tight text-foreground">
          Acompaña
        </span>
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-auto w-full justify-start gap-3 rounded-xl border-border bg-card px-3 py-2.5 shadow-sm hover:bg-secondary"
      >
        <Avatar size="lg" className="bg-primary text-primary-foreground after:border-transparent">
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
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </Button>

      <nav className="flex flex-col gap-6">
        <div>
          <p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            Menú principal
          </p>
          <ul className="flex flex-col gap-1">
            {mainNav.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
                        isActive
                          ? 'bg-secondary font-semibold text-primary'
                          : 'font-medium text-muted-foreground hover:bg-muted hover:text-foreground',
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
              )
            })}
          </ul>
        </div>

        <div>
          <p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            Configuración
          </p>
          <ul className="flex flex-col gap-1">
            {configNav.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
                        isActive
                          ? 'bg-secondary font-semibold text-primary'
                          : 'font-medium text-muted-foreground hover:bg-muted hover:text-foreground',
                      )
                    }
                  >
                    <Icon className="size-4 shrink-0" />
                    {item.label}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>
    </aside>
  )
}
