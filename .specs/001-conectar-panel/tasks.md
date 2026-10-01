# Tasks

1. [x] Puerto fijo 5173 en `vite.config.ts` (`server`/`preview`, `strictPort`)
2. [x] `.env.example`, `src/vite-env.d.ts`, `src/lib/env.ts`, `.gitignore`
3. [x] `src/lib/api/client.ts` (ApiError, request, Bearer, manejo de 401 NO_SESSION)
4. [x] `src/data/api-types.ts` con los tipos del contrato copiados de `src/panel/`
5. [x] `src/lib/api/panel.ts` + `src/lib/api/queryKeys.ts`
6. [x] `src/store/authStore.ts` (token, educator, persistencia en localStorage)
7. [x] `src/components/auth/LoginPage.tsx`
8. [x] `src/App.tsx`: ruta `/login`, guard, quitar fallbackEducator
9. [x] `src/lib/queryClient.ts`: defaultOptions (retry 4xx, staleTime)
10. [x] `src/data/dashboard.ts`: `mondayOf`, `todayChileYmd`, `SessionStatus` de 4 valores, quitar constantes demo
11. [x] `src/data/adapters/summary.ts` y `src/data/adapters/agenda.ts`
12. [x] Reescribir `useSummary`, `useAgenda`, `usePreferences` sobre el cliente nuevo
13. [x] Actualizar `DashboardPage`, `AgendaPage`, `PreferencesPage`, `StatCards`, `SlotAndHours`
14. [x] Unificar `StatusBadge` (4 estados) y quitar el duplicado
15. [x] Borrar código obsoleto: `buildDaySlots`, `WORK_WEEK`, `templateTimesForDate`,
       `slotsFromRange`, `DEMO_TODAY`
16. [x] Reescribir `src/mocks/fixtures.ts` y `src/mocks/handlers.ts` con las formas reales
17. [x] `src/main.tsx`: gate por `USE_MSW`
18. [x] Borrar `docs/` duplicado; actualizar `CLAUDE.md`, `AGENTS.md`, `README.md`, `../CLAUDE.md`
19. [x] `pnpm check` y `pnpm build` en verde
20. [ ] Verificación manual en modo MSW (sanity check hecho: dev server arranca, login/rutas sirven)
21. [ ] Verificación manual contra backend real (pendiente: requiere levantar `profesor-scheduling-api` localmente)
