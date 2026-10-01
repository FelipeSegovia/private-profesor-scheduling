# Tasks

1. [x] `src/data/api-types.ts`: agregar `PanelGuardianListItem`, `PanelChildDto`,
       `PanelGuardianDto`, `PanelGuardianDetail`, `CreateSessionBody`
2. [x] `src/data/agenda.ts`: agregar `startsAt: string` a `DaySlot`
3. [x] `src/data/adapters/agenda.ts`: propagar `cell.startsAt` en `cellToDaySlot`
4. [x] `src/lib/api/panel.ts`: agregar `listGuardians`, `getGuardian`, `createSession`
5. [x] `src/lib/api/queryKeys.ts`: agregar `guardians(query?)`, `guardian(id)`
6. [x] Instalar componentes shadcn: `dialog`, `input`, `label`, `popover` (se descartó
       `command`/`cmdk`/`input-group`: el buscador se resolvió con `Input` + lista
       filtrada, sin la dependencia extra)
7. [x] `src/data/queries/useGuardians.ts` (debounce de 300ms del término de búsqueda,
       aplicado en `CreateSessionDialog`)
8. [x] `src/data/queries/useGuardianDetail.ts`
9. [x] `src/data/queries/useCreateSession.ts` (invalida `["agenda"]`/`["summary"]` al
       completar; también invalida `["agenda"]` en `onError` cuando el código es
       `SLOT_TAKEN`)
10. [x] `src/components/agenda/CreateSessionDialog.tsx`
11. [x] `src/components/agenda/AgendaPage.tsx`: conectado "Agendar" por cupo; "Nueva
        cita" del encabezado abre el diálogo con el primer cupo libre del día
        seleccionado (deshabilitado si no hay ninguno)
12. [x] `src/mocks/handlers.ts` + `src/mocks/fixtures.ts`: handlers y fixtures de
        guardians/children y `POST /api/panel/sessions` (con validación de
        PAST_SLOT/SLOT_BLOCKED/SLOT_TAKEN/CHILD_NOT_FOUND igual que el backend real)
13. [x] `pnpm check` y `pnpm build` en verde
14. [ ] Verificación manual en modo MSW (flujo completo de creación + los 4 errores)
15. [ ] Verificación manual contra backend real (requiere `profesor-scheduling-api`
        levantado con `pnpm db:seed`)
