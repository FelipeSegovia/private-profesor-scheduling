Estado: implementación completa (tareas 1-13), pendiente verificación manual
Última tarea completada: 13 (`pnpm check` y `pnpm build` en verde)
Siguiente: verificación manual en modo MSW (tarea 14) y, si el usuario levanta
`profesor-scheduling-api` localmente, contra el backend real (tarea 15)

Notas:
- `DaySlot` ahora trae `startsAt` (propagado desde `SlotCell.startsAt`, que el backend
  ya resuelve), usado tal cual al llamar `POST /api/panel/sessions`.
- `useCreateSession` sigue el mismo patrón de `useMutation` que ya usa
  `LoginPage.tsx` para el login (corrección: la exploración previa dijo que no había
  ninguna `useMutation` en el proyecto; sí la había, solo que no en `src/data/queries/`).
  Invalida `["agenda"]` y `["summary"]` por prefijo (no por fecha/semana exacta) para
  cubrir cualquier vista activa.
- Se instalaron los componentes shadcn `dialog`, `input`, `label`, `popover`
  (`popover` quedó sin usar por ahora, se dejó por si una iteración futura lo necesita
  para el buscador). Se descartó `command`/`cmdk`/`input-group`: el buscador de
  apoderados se resolvió con `Input` + lista filtrada simple, evitando una dependencia
  nueva (`cmdk`) que no se necesitaba.
- `label.tsx` (primitivo shadcn genérico) lleva un `biome-ignore` para
  `lint/a11y/noLabelWithoutControl`: el componente no tiene contenido propio, lo da
  quien lo usa.
- Mocks: `GET /api/panel/guardians`, `GET /api/panel/guardians/:id` y
  `POST /api/panel/sessions` ya responden en modo MSW, con 9 apoderados de fixture
  (incluido uno sin niños y otro con dos, para cubrir esos casos en el diálogo) y las
  mismas reglas de error que el backend real (`PAST_SLOT`, `CHILD_NOT_FOUND`,
  `SLOT_BLOCKED`, `SLOT_TAKEN`).
- El botón "Nueva cita" del encabezado no tiene selector de fecha/hora propio (fuera de
  alcance de esta spec): abre el diálogo con el primer cupo libre del día seleccionado
  en la agenda, y queda deshabilitado si ese día no tiene ninguno.
- Pendiente de que el usuario pruebe el flujo en el navegador (`pnpm dev`) y, si quiere,
  contra el backend real.
