# Plan: Crear cita única desde el panel privado

Detalle completo de decisiones y contrato exacto en el plan aprobado por el usuario (sesión
de planificación, ver `spec.md` para el contrato). Resumen de archivos a tocar:

## Archivos nuevos

- `src/data/queries/useGuardians.ts` — búsqueda de apoderados (`GET /api/panel/guardians?query=`)
- `src/data/queries/useGuardianDetail.ts` — ficha de un apoderado (`GET /api/panel/guardians/:id`)
- `src/data/queries/useCreateSession.ts` — primera `useMutation` del proyecto (`POST /api/panel/sessions`)
- `src/components/agenda/CreateSessionDialog.tsx` — diálogo de creación (buscar apoderado →
  elegir niño → `helpRequest` opcional → crear)
- `src/components/ui/{dialog,input,label,command,popover}.tsx` — vía `pnpm dlx shadcn@latest add ...`
  (estilo `base-nova`, config en `components.json`)

## Archivos modificados

- `src/data/api-types.ts` — agregar `PanelGuardianListItem`, `PanelChildDto`,
  `PanelGuardianDto`, `PanelGuardianDetail`, `CreateSessionBody`
- `src/data/agenda.ts` — agregar `startsAt: string` a `DaySlot`
- `src/data/adapters/agenda.ts` — propagar `cell.startsAt` en `cellToDaySlot`
- `src/lib/api/panel.ts` — agregar `listGuardians`, `getGuardian`, `createSession`
- `src/lib/api/queryKeys.ts` — agregar `guardians(query?)`, `guardian(id)`
- `src/components/agenda/AgendaPage.tsx` — estado local `selectedSlot`, quitar `disabled` de
  "Nueva cita" y "Agendar" (prop `onAgendar` en `SlotRow`), montar `CreateSessionDialog`
- `src/mocks/handlers.ts`, `src/mocks/fixtures.ts` — handlers y fixtures de
  guardians/children y `POST /api/panel/sessions`

## No se toca

- `src/lib/api/client.ts` — `ApiError` (`status`, `code`) ya alcanza para los 4 errores
  del endpoint, sin cambios al cliente.
- `src/store/agendaViewStore.ts` — el cupo seleccionado para crear cita es estado local del
  componente, no estado de navegación semana/día (su propósito es otro).

## Verificación end-to-end

1. `pnpm check` (biome) y `pnpm build` en verde.
2. Modo MSW (`VITE_USE_MSW=true`, default): `pnpm dev`, abrir `/agenda`, clic en "Agendar"
   sobre un cupo libre, buscar un apoderado mock, elegir un niño, crear la cita y confirmar
   que el cupo pasa a `session` sin recargar la página.
3. Modo backend real (`VITE_USE_MSW=false`, `profesor-scheduling-api` en `:3000`, con
   `pnpm db:seed` de ese repo): repetir el mismo flujo contra datos reales.
4. Forzar cada error del contrato (cupo bloqueado, cupo ya pasado, cupo tomado por otra
   pestaña/sesión) y confirmar que el mensaje en español es correcto y el diálogo queda
   usable después de cada uno.
