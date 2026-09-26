import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import type { Educator } from '@/data/dashboard'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/components/dashboard/DashboardPage'
import { PlaceholderPage } from '@/components/pages/PlaceholderPage'
import { Skeleton } from '@/components/ui/skeleton'

const fallbackEducator: Educator = {
  firstName: 'Loreto',
  fullName: 'Loreto Castillo',
  role: 'Educadora diferencial',
  initials: 'LC',
}

function ShellFallback() {
  return (
    <div className="flex min-h-svh flex-col gap-4 bg-background p-6 lg:flex-row">
      <Skeleton className="h-64 w-full rounded-2xl lg:h-auto lg:w-64" />
      <div className="flex flex-1 flex-col gap-4">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    </div>
  )
}

function App() {
  const [educator, setEducator] = useState<Educator | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadEducator() {
      try {
        const response = await fetch('/api/summary')
        if (!response.ok) throw new Error('summary failed')
        const data = (await response.json()) as { educator: Educator }
        if (!cancelled) setEducator(data.educator)
      } catch {
        if (!cancelled) setEducator(fallbackEducator)
      } finally {
        if (!cancelled) setReady(true)
      }
    }

    void loadEducator()
    return () => {
      cancelled = true
    }
  }, [])

  if (!ready || !educator) {
    return <ShellFallback />
  }

  return (
    <Routes>
      <Route element={<AppShell educator={educator} />}>
        <Route index element={<DashboardPage />} />
        <Route
          path="agenda"
          element={
            <PlaceholderPage
              title="Mi agenda"
              description="Aquí verás la agenda completa de la educadora."
            />
          }
        />
        <Route
          path="familias"
          element={
            <PlaceholderPage
              title="Familias"
              description="Aquí gestionarás las fichas de apoderados y niños."
            />
          }
        />
        <Route
          path="historial"
          element={
            <PlaceholderPage
              title="Historial"
              description="Aquí revisarás sesiones canceladas y no confirmadas."
            />
          }
        />
        <Route
          path="horarios"
          element={
            <PlaceholderPage
              title="Horarios"
              description="Aquí configurarás la plantilla semanal de cupos."
            />
          }
        />
        <Route
          path="preferencias"
          element={
            <PlaceholderPage
              title="Preferencias"
              description="Aquí ajustarás plazos de confirmación y avisos."
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
