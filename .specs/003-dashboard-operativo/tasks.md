# Tasks

Orden pensado para que el proyecto compile y la app siga usable en cada paso.

1. [x] `src/data/agenda.ts`: agregar `SlotRef { date; time; startsAt }`
2. [x] `src/components/agenda/CreateSessionDialog.tsx`: prop `slot: SlotRef | null`
3. [x] `src/components/shared/SlotRow.tsx`: extraer el `SlotRow` local de `AgendaPage.tsx`
4. [x] `src/components/agenda/AgendaPage.tsx`: usar el `SlotRow` compartido; `/agenda` quedó
       con el mismo render (`onAgendar={setSelectedSlot}`) y el build en verde
5. [x] `src/components/dashboard/AgendaCard.tsx`: recibe `slots: DaySlot[]` + `onAgendar` +
       `isLoading`/`isError`/`onRetry` (se usa `isLoading`, no `isPending`); copy del día vacío
       alineado con `AgendaPage`; botón `MoreHorizontal` muerto eliminado
6. [x] `src/components/dashboard/DashboardPage.tsx`: `useAgenda` + `daySlotsFromApi`,
       `selectedSlot`, `CreateSessionDialog` montado, cabecera "Nueva cita" cableada
       (**bug de navegación entre días/semanas corregido**)
7. [x] `startsAt` en `AvailableSlot` (`src/data/dashboard.ts` + adaptador). Además, no previsto
       en el plan: `past` propagado a `DaySlot` desde `SlotCell.past` y helper `firstFreeSlot`,
       porque sin eso "Nueva cita" podía auto-elegir un cupo ya pasado y fallar con `PAST_SLOT`
8. [x] `src/components/dashboard/SlotAndHours.tsx`: prop `onAgendar` + fecha del cupo visible
9. [x] `src/components/dashboard/QuickAccessCard.tsx`: props `onCreate`/`canCreate`
10. [x] `date` en `AttentionItem` (`src/data/dashboard.ts` + adaptador)
11. [x] `src/components/dashboard/AttentionCard.tsx`: "Ver pendientes" navega a `/agenda`
        posicionando el store con `mondayOf`; deshabilitado sin pendientes; + estado vacío
        (antes el card quedaba con la lista vacía y el botón activo)
12. [x] Hints: `confirmed` → "De aquí al domingo", `pending` → "Sin confirmar, a futuro"
13. [x] Borrado el código muerto: `SummaryResponse.sessions`, `sessionDtoToSession` + su
        `import type { Session }`, y `sessionsForDate`. Helpers nuevos compartidos en
        `src/data/agenda.ts`: `countByKind`, `daySummaryLabel`, `firstFreeSlot`
14. [x] `pnpm check` y `pnpm build` en verde (único warning restante es el preexistente de
        `src/main.tsx:23`)
15. [ ] Verificación manual en modo MSW (los 7 puntos de `plan.md`) — pendiente del usuario.
        Verificado sin navegador con un script sobre los fixtures reales: los 7 días de la semana
        resuelven sus cupos (el bug), `firstFreeSlot` descarta el cupo libre ya pasado, el
        domingo cae en "Sin cupos en la plantilla", y la semana siguiente carga
16. [ ] Verificación manual contra el backend real (requiere `profesor-scheduling-api` levantado
        con `pnpm db:seed`)
