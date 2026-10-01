# Plan: Dashboard operativo (home del panel)

Detalle completo de decisiones en el plan aprobado por el usuario (sesión de planificación).
Resumen de archivos a tocar:

## Archivos nuevos

- `src/components/shared/SlotRow.tsx` — el `SlotRow` que hoy vive dentro de `AgendaPage.tsx`,
  extraído para que lo compartan `/agenda` y el card del home. Sin el botón `MoreHorizontal`
  muerto que tenía el `AgendaCard`.

## Archivos modificados

- `src/data/agenda.ts` — + `SlotRef { date; time; startsAt }`. **No** hace falta
  `DaySlot extends SlotRef`: por tipado estructural un `DaySlot` ya encaja donde se pide un
  `SlotRef`.
- `src/components/agenda/CreateSessionDialog.tsx` — prop `slot: SlotRef | null` (solo usa
  `date`, `time`, `startsAt`), para que sirva tanto un cupo de la agenda como el próximo cupo
  libre del resumen.
- `src/components/agenda/AgendaPage.tsx` — importar el `SlotRow` compartido en vez del local.
- `src/components/dashboard/AgendaCard.tsx` — recibe `slots: DaySlot[]`, `onAgendar`, y flags de
  carga/error propios; renderiza con el `SlotRow` compartido; copy del día vacío alineado con
  `AgendaPage`.
- `src/components/dashboard/DashboardPage.tsx` — + `useAgenda(effectiveWeekStart)` y
  `daySlotsFromApi`; estado local `selectedSlot: SlotRef | null`; monta `CreateSessionDialog`;
  cablea cabecera "Nueva cita"; deriva el cupo de la semana visible con respaldo en
  `summary.availableSlot`.
- `src/data/dashboard.ts` — + `startsAt` en `AvailableSlot`, + `date` en `AttentionItem`,
  − `sessions` de `SummaryResponse`, − helper `sessionsForDate`.
- `src/data/adapters/summary.ts` — propagar `startsAt` (de `nextFreeSlot`) y `date`; hints de
  `confirmed`/`pending` corregidos; − `sessionDtoToSession` y su `import type { Session }`.
- `src/components/dashboard/QuickAccessCard.tsx` — prop `onCreate` + `disabled`.
- `src/components/dashboard/SlotAndHours.tsx` — prop `onAgendar`; mostrar también la fecha del
  cupo (`formatLongDate(slot.date)`), no solo la hora.
- `src/components/dashboard/AttentionCard.tsx` — "Ver pendientes" navega a `/agenda` posicionando
  el `agendaViewStore`; deshabilitado si no hay pendientes.

## No se toca

- `src/data/queries/useCreateSession.ts` — su invalidación de `["agenda"]`/`["summary"]` ya cubre
  el refresco de contadores, agenda y actividad del home.
- `src/store/agendaViewStore.ts` — el cupo elegido para crear vive en estado local del
  componente, no en el store (que es solo navegación semana/día).
- `RecentActivity.tsx` y `StatCards.tsx` — sin cambios de código; lo único que cambia de los
  contadores son dos strings, y viven en el adaptador.

## Trampas identificadas en la validación del diseño

- `useAgenda` lleva `enabled: Boolean(weekStart)` y en `/` el `weekStart` arranca vacío: dentro
  del card hay que mirar **`isLoading`, no `isPending`** (en TanStack v5 una query deshabilitada
  queda `isPending` para siempre).
- Borrar `sessionDtoToSession` obliga a quitar también el `import type { Session }` del adaptador:
  `tsconfig.app.json` tiene `noUnusedLocals: true` y si no, `pnpm build` falla.
- Ese tsconfig **no** activa `strict`, así que `tsc` no atrapa errores de null/varianza: la
  verificación en navegador no es opcional.
- `getAttention` del backend puede devolver pendientes de la semana siguiente, así que el salto
  de "Ver pendientes" tiene que usar `mondayOf(item.date)`, nunca la fecha cruda.

## Verificación end-to-end

1. `pnpm check` y `pnpm build` en verde.
2. Modo MSW (`pnpm dev`, default) en `/`: navegación de días/semanas en el card; crear cita por
   los cuatro caminos; verificar refresco de contadores/agenda/actividad; "Nueva cita" tras
   cambiar de semana; semana sin cupos libres; domingo; "Ver pendientes".
3. Contra el backend real (`VITE_USE_MSW=false`, `profesor-scheduling-api` en `:3000` con
   `pnpm db:seed`): camino principal de creación y navegación de la agenda.
4. Revisar que `/agenda` siga intacta tras extraer el `SlotRow`.
