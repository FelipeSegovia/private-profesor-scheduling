# Plan: Conectar el panel privado al backend real

Detalle completo de fases, decisiones y contrato exacto en el plan aprobado por el usuario
(sesión de planificación). Resumen de archivos a tocar:

## Archivos nuevos

- `.env.example`, `.env.local` (no versionado)
- `src/vite-env.d.ts`
- `src/lib/env.ts`
- `src/lib/api/client.ts`, `src/lib/api/panel.ts`, `src/lib/api/queryKeys.ts`
- `src/store/authStore.ts`
- `src/components/auth/LoginPage.tsx`
- `src/data/api-types.ts`
- `src/data/adapters/summary.ts`, `src/data/adapters/agenda.ts`
- `src/data/queries/useSlots.ts` (si aplica) — no, ver nota abajo

## Archivos modificados

- `vite.config.ts` — `server.port`/`preview.port` fijos en 5173, `strictPort: true`
- `.gitignore` — agregar `.env`, `.env*.local`
- `src/main.tsx` — gate de MSW por `USE_MSW`, providers sin cambios de fondo
- `src/App.tsx` — ruta `/login`, guard de auth, quitar `fallbackEducator`
- `src/lib/queryClient.ts` — `defaultOptions` (retry, staleTime)
- `src/data/dashboard.ts` — agregar `mondayOf`, ampliar `SessionStatus` a 4 valores, quitar
  `DEMO_TODAY`/`demoWeekStart`
- `src/data/agenda.ts` — reemplazar `buildDaySlots`/`AgendaResponse` por el adaptador nuevo
- `src/data/schedule.ts` — quitar `WORK_WEEK` y helpers derivados (ahora vienen del servidor)
- `src/data/queries/useSummary.ts`, `useAgenda.ts`, `usePreferences.ts` — usar el cliente nuevo
- `src/components/dashboard/DashboardPage.tsx`, `src/components/agenda/AgendaPage.tsx` — leer
  fechas del servidor, refetch en vez de reload
- `src/components/dashboard/StatCards.tsx`, `SlotAndHours.tsx` — `AvailableSlot` nullable
- `src/components/preferences/PreferencesPage.tsx` — `WorkDayView`, 3 plazos
- `StatusBadge` (duplicado en dashboard y agenda) — unificar y ampliar a 4 estados
- `src/mocks/fixtures.ts`, `src/mocks/handlers.ts` — formas reales del contrato
- `CLAUDE.md`, `AGENTS.md`, `README.md`, `../CLAUDE.md` (raíz)

## Archivos eliminados

- `docs/` (copia obsoleta del contrato; se reemplaza por enlace en `CLAUDE.md`)

## Verificación end-to-end

Ver sección "Verificación end-to-end" del plan aprobado: pasos con MSW, pasos contra el backend
real (`pnpm db:up`, `db:migrate`, `db:seed`, `start:dev`), curls de comparación de contrato, y
chequeos de build/lint/gitignore.
