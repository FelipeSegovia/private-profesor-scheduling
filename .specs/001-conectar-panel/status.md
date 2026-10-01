Estado: completada
Última tarea completada: 19 (pnpm check y pnpm build en verde)
Siguiente: verificación manual contra el backend real (tareas 20-21, pendientes de que
el usuario levante `profesor-scheduling-api` localmente)

Notas:
- Puerto 5173 fijo con `strictPort`; verificado que Vite falla en vez de saltar a 5174
  cuando el puerto está ocupado (se probó contra un proceso de terceros ya corriendo ahí).
- Login, guard de rutas y las tres pantallas (resumen, agenda, preferencias) leen del
  cliente HTTP nuevo (`src/lib/api/`), con adaptadores en `src/data/adapters/` que traducen
  el contrato real (`PanelSummaryResponse`, `PanelAgendaResponse`, `PanelPreferencesResponse`)
  a los tipos de presentación que ya consumían los componentes.
- MSW reescrito con la forma real del contrato (`src/mocks/fixtures.ts` genera agenda y
  resumen a partir de la fecha de Chile real, no una fecha demo fija), incluida la
  validación de que `weekStart` sea lunes.
- `docs/` (copia del contrato) borrado; el enlace vive en `CLAUDE.md`.
- `pnpm check` y `pnpm build` en verde. Único warning restante (`noNonNullAssertion` en
  `src/main.tsx:23`) es preexistente, no introducido por este cambio.
- Bug encontrado y corregido durante la implementación: `AgendaPage` calculaba "hoy" con
  `toISOString()` (UTC del navegador) en vez de la fecha de Chile; se centralizó
  `todayChileYmd()` en `src/data/dashboard.ts`, reusado también por los mocks.
- Pendiente de verificar con el usuario: pasos 20-21 de `tasks.md` (correr contra el
  backend real levantado) — no se hizo en esta sesión porque requiere Postgres + la API
  arriba; las instrucciones quedaron en `README.md` y `CLAUDE.md`.
