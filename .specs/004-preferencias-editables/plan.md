# Plan: Preferencias editables (plantilla por día + plazos)

Contrato exacto y requisitos en `spec.md` (aprobado). Resumen de archivos a tocar:

## Archivos nuevos

- `src/data/preferences.ts` — lógica pura, sin React:
  - `START_HOURS` (`07:00`…`22:00`) y `endHoursFor(start)` (inicio + 1 h … `23:00`).
  - `slotsInRange(start, end)`: cantidad de cupos de 1 h (end exclusivo, igual que
    `expandRangeToHours` del backend).
  - `toWorkDayInput(day: WorkDayView)` y `buildWorkWeekPayload(workWeek, edited)`: los 7 días
    con solo el editado reemplazado.
  - `validateWorkDay(input)`: mensaje en español si `available` y `end <= start`; `null` si es válido.
  - `validatePreferences(input)`: espejo de `profesor-scheduling-api/src/domain/preferences.ts`,
    mismo orden de chequeos, devuelve `{ code, message }` o `null`.
- `src/data/queries/useUpdateTemplate.ts` y `src/data/queries/useUpdatePreferences.ts` —
  `useMutation` como `useCreateSession.ts`. `onSuccess`: `setQueryData(queryKeys.preferences(), …)`
  (en la plantilla se fusiona `workWeek` con los plazos ya en caché) e invalidar `["agenda"]` y
  `["summary"]` por prefijo.
- `src/components/preferences/WorkDayDialog.tsx` — diálogo de un día: toggle, dos `<select>`,
  preview, avisos (fijo, huecos en este día, huecos en otros días), error local o del backend.
  Mismo patrón de `Dialog` que `components/agenda/CreateSessionDialog.tsx`.
- `src/components/preferences/DeadlinesDialog.tsx` — tres `Input type="number"`, validación espejo,
  error del backend con `ApiError.message`.

## Archivos modificados

- `src/data/api-types.ts` — `WorkDayInput`, `UpdateTemplateBody`, `UpdateTemplateResult`,
  `UpdatePreferencesBody`.
- `src/lib/api/panel.ts` — `updateTemplate(body)`, `updatePreferences(body)` con el `put` existente.
- `src/components/preferences/PreferencesPage.tsx` — botón "Editar" por fila y "Editar plazos";
  estado local del día abierto; aviso de `orphanSessions` en la card "Horarios" (se limpia al
  volver a editar).
- `src/mocks/fixtures.ts` — `MOCK_TEMPLATE` y los tres plazos pasan a un objeto mutable en
  memoria (`mockSchedule`). `buildWeekDays` lee plantilla y horizonte de ahí; `preferencesFixture`
  pasa a `buildPreferences()` (deriva `workWeek` como `workWeekFromTemplateRows`: rango,
  `times`, `contiguous`). Funciones nuevas `replaceMockTemplate(workWeek)` (devuelve
  `orphanSessions`) y `updateMockPreferences(body)`.
- `src/mocks/handlers.ts` — `GET /api/panel/preferences` usa `buildPreferences()`;
  `PUT /api/panel/template` y `PUT /api/panel/preferences` (auth + mismas reglas/códigos que el
  backend). `CONFIRMATION_DEADLINE_HOURS` en `POST /sessions` y en `buildSummary` pasa a leer el
  valor mutable.
- `CLAUDE.md` (app) — "Editar plantilla y preferencias" sale de la lista de pendientes; mencionar
  `src/data/preferences.ts` en Arquitectura.
- `../CLAUDE.md` (raíz) — hoja de ruta: la plantilla y las preferencias ya están conectadas.

## Decisiones

- `orphanSessions` en MSW: como `BOOKINGS` se definen por desplazamiento desde el lunes de la
  semana consultada, se cuentan las reservas activas de la semana actual aún no pasadas cuya
  `(weekday, time)` quedó fuera de la plantilla. Es una aproximación del backend, suficiente
  para ejercitar el aviso.
- No se agrega una librería de toasts: el aviso de `orphanSessions` va inline en la card.
- Selects nativos (`<select>`) con las clases de `Input`: no hay `select` de shadcn instalado y
  no hace falta la dependencia.

## No se toca

- `src/lib/api/client.ts` — `put` y `ApiError` ya alcanzan.
- `src/lib/api/queryKeys.ts` — se reutiliza `preferences()`.
- `docs/mvp/` — sin cambios de reglas de negocio.

## Verificación end-to-end

1. `pnpm check` y `pnpm build` en verde.
2. Modo MSW: martes a 18:00–21:00 → fila con 3 cupos y `/agenda` con 18:00; desactivar sábado →
   "No trabaja" y sin cupos; activar domingo → cupos nuevos; término ≤ inicio → error local;
   quitar una hora con reserva activa futura → aviso de `orphanSessions`; plazos con serie ≤
   confirmación → `INVALID_PREFERENCES`; horizonte 60 → `INVALID_RANGE`; plazos válidos se guardan.
3. Backend real (`VITE_USE_MSW=false`, API en `:3000` con `pnpm db:seed`): los mismos casos.
