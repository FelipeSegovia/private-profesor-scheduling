import { Outlet, useLocation } from 'react-router'
import type { Educator } from '@/data/dashboard'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

const breadcrumbByPath: Record<string, string> = {
  '/': 'Resumen',
  '/agenda': 'Mi agenda',
  '/familias': 'Familias',
  '/historial': 'Historial',
  '/horarios': 'Horarios',
  '/preferencias': 'Preferencias',
}

interface AppShellProps {
  educator: Educator
}

export function AppShell({ educator }: AppShellProps) {
  const location = useLocation()
  const breadcrumbCurrent = breadcrumbByPath[location.pathname] ?? 'Resumen'

  return (
    <div className="flex min-h-svh flex-col bg-background lg:flex-row">
      <Sidebar educator={educator} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar educator={educator} breadcrumbCurrent={breadcrumbCurrent} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
