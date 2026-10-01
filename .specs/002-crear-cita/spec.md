# Spec: Crear cita única desde el panel privado

## Objetivo

Permitir a la educadora crear una cita única para un cupo libre de la agenda, eligiendo un
apoderado y un niño ya registrados, usando el endpoint real `POST /api/panel/sessions` que
ya expone `profesor-scheduling-api` (spec `004-panel-educadora`, completada).

## Contexto

`AgendaPage.tsx` ya tiene los botones "Nueva cita" (encabezado) y "Agendar" (por cupo libre),
pero están `disabled`: la spec `001-conectar-panel` dejó explícitamente fuera de alcance
"cualquier endpoint de escritura del panel ... se conectan en una spec `002` posterior".

Crear una cita requiere un `childId`, y hoy este frontend no tiene ninguna UI para
encontrarlo: los endpoints `panel-people` (`GET/POST /api/panel/guardians`,
`GET /api/panel/guardians/:id`, `POST /api/panel/guardians/:id/children`) no están
conectados en absoluto. Fuente del contrato:
[`../../../profesor-scheduling-api/docs/API.md`](../../../profesor-scheduling-api/docs/API.md)
y el código de `src/panel/sessions/` y `src/panel/people/` en ese repo.

Contrato exacto usado por esta spec:

- `POST /api/panel/sessions` — body `{ childId: string, startsAt: string /* ISO */, helpRequest?: string }`
  → 201 `PanelSessionDto`; 400 `PAST_SLOT`; 404 `CHILD_NOT_FOUND`; 409 `SLOT_BLOCKED` / `SLOT_TAKEN`.
- `GET /api/panel/guardians?query=` → `{ guardians: PanelGuardianListItem[] }`
  (`id, name, email, phone, childrenCount, activeSessions`).
- `GET /api/panel/guardians/:id` → `PanelGuardianDetail`
  (`{ guardian, children: PanelChildDto[], sessions }`); 404 `GUARDIAN_NOT_FOUND`.
- `SlotCell` (ya en `src/data/api-types.ts` de este frontend) ya trae `startsAt: string` por
  cupo — no se reconstruye a mano desde `date`+`time`.

## Requisitos funcionales

- Desde `AgendaPage`, el botón "Agendar" de un cupo libre (y el botón "Nueva cita" del
  encabezado) abren un diálogo de creación de cita.
- El diálogo permite buscar un apoderado por nombre (`GET /api/panel/guardians?query=`),
  seleccionar uno, ver sus niños (`GET /api/panel/guardians/:id`) y elegir uno.
- Campo opcional de `helpRequest` (texto libre).
- Al confirmar, llama `POST /api/panel/sessions` con el `childId` elegido y el `startsAt`
  del cupo (tomado de `SlotCell.startsAt`, propagado a `DaySlot`).
- Tras éxito: cierra el diálogo, invalida/refresca la agenda de la semana activa y el
  resumen del día (`queryKeys.agenda`, `queryKeys.summary`), y muestra confirmación.
- Maneja los errores del contrato con mensajes en español:
  - 400 `PAST_SLOT`: "Ese cupo ya pasó."
  - 404 `CHILD_NOT_FOUND`: "No se encontró ese niño."
  - 409 `SLOT_BLOCKED`: "Ese cupo está bloqueado."
  - 409 `SLOT_TAKEN`: "Ese cupo ya fue tomado por otra sesión." + refresca la agenda.
- `DaySlot` (`src/data/agenda.ts`) gana un campo `startsAt: string`, poblado por el
  adaptador (`src/data/adapters/agenda.ts`) desde `SlotCell.startsAt`.
- Mocks MSW actualizados con handlers de `GET /api/panel/guardians`, `GET /api/panel/guardians/:id`
  y `POST /api/panel/sessions`, con fixtures de apoderados/niños de ejemplo, para que el
  modo mock ejercite el mismo flujo que el backend real.

## Fuera de alcance

- Crear fichas nuevas de apoderado o niño (`POST /api/panel/guardians`,
  `POST /api/panel/guardians/:id/children`) — spec futura.
- Crear serie semanal (`POST /api/panel/series`), mover, confirmar, cancelar, bloquear
  cupos/días, editar plantilla/preferencias — cada una su propia spec futura.
- Ficha por alumno (fuera de alcance también en specs previas).

## Criterios de aceptación

- [ ] Clic en "Agendar" sobre un cupo libre abre el diálogo con ese cupo preseleccionado
      (fecha/hora visibles, no editables).
- [ ] Buscar un apoderado filtra la lista en vivo; elegir uno carga y muestra sus niños.
- [ ] El botón de crear está deshabilitado sin un niño elegido.
- [ ] Una creación exitosa cierra el diálogo y la sesión aparece en la agenda sin recargar
      la página.
- [ ] Los 4 errores del contrato (`PAST_SLOT`, `CHILD_NOT_FOUND`, `SLOT_BLOCKED`,
      `SLOT_TAKEN`) se muestran en español y el diálogo queda usable después de cada uno.
- [ ] `pnpm check` y `pnpm build` en verde.
