# Spec: Dashboard operativo (home del panel)

## Objetivo

Que el home (`/`) deje de ser una maqueta parcialmente conectada: crear cita desde sus distintas
entradas, ver la agenda real de cualquier día de la semana con sus cupos libres, y contadores
cuyos textos de ayuda describan lo que el backend realmente cuenta.

## Contexto

La spec `001-conectar-panel` conectó el home solo para **leer** el resumen, y la spec
`002-crear-cita` construyó el diálogo de creación pero lo cableó únicamente en `/agenda`. Estado
real de cada pieza del home hoy:

| Pieza | Estado |
| --- | --- |
| Contadores (`StatCards`) | Ya funcionan con datos reales (`summary.stats` ← `PanelStats`). Dos de los cuatro hints describen mal lo que cuenta el backend. |
| Actividad reciente (`RecentActivity`) | Ya funciona: últimos 15 movimientos reales + filtros Todas/Reservas/Cambios client-side. |
| Mi agenda (`AgendaCard`) | **Bug**: recibe `summary.sessions`, que es solo `todaySessions`. Al navegar a otro día o semana siempre muestra "Sin sesiones este día". Tampoco lista cupos libres ni permite agendar. |
| Crear cita | Cuatro botones sin `onClick`: "Nueva cita" (cabecera), `QuickAccessCard`, "Agendar" del próximo cupo libre (`SlotAndHours`) y "Ver pendientes" (`AttentionCard`). |

Semántica real de los contadores, leída de
[`panel-dashboard.service.ts`](../../../profesor-scheduling-api/src/panel/dashboard/panel-dashboard.service.ts)
(`computeStats`): `today` = sesiones `PENDING|CONFIRMED` del día; `confirmed` = `CONFIRMED` entre
ahora y el fin de la semana (domingo); `pending` = **todas** las `PENDING` futuras, sin tope de
semana; `families` = apoderados distintos con sesiones activas futuras.

Piezas que se reutilizan tal cual: `CreateSessionDialog` y `useCreateSession` (spec 002, este
último ya invalida `["agenda"]` y `["summary"]`, así que contadores, agenda y actividad se
refrescan solos al crear), `useAgenda`, `daySlotsFromApi`, y el `SlotRow` que hoy vive dentro de
`AgendaPage`.

## Requisitos funcionales

- **Mi agenda**: el `AgendaCard` lee `/api/panel/agenda` de la semana activa y muestra, para el
  día seleccionado, todos sus cupos (sesión, libre, bloqueado, fuera de horizonte) con el mismo
  `SlotRow` que usa `/agenda`. Cada cupo libre ofrece "Agendar".
- **Crear cita** desde cuatro caminos, todos abriendo el `CreateSessionDialog` existente:
  cada cupo libre del `AgendaCard`, la cabecera "Nueva cita", `QuickAccessCard` y el "Agendar"
  del próximo cupo libre (`SlotAndHours`).
  - La cabecera y `QuickAccessCard` abren sobre el primer cupo libre **de la semana/día que se
    está viendo** (derivado de los cupos ya cargados), con `summary.availableSlot` como respaldo.
    El `nextFreeSlot` del backend siempre se calcula sobre la semana de hoy, así que usarlo a
    secas abriría el diálogo sobre una fecha que la educadora no tiene a la vista.
  - Si no hay ningún cupo libre, esas entradas quedan deshabilitadas.
- **Contadores**: corregir solo los dos hints imprecisos (`confirmed` → "De aquí al domingo";
  `pending` → "Sin confirmar, a futuro"). Los valores ya son correctos y no se vuelven
  clickeables.
- **Actividad reciente**: sin cambios funcionales; se verifica que refresca al crear una cita.
- **Ver pendientes** (`AttentionCard`): navega a `/agenda` posicionado en la semana y el día del
  primer pendiente (`setWeekStart(mondayOf(date))` **y** `setSelectedDate(date)`; `useAgenda`
  exige lunes y `daySlotsFromApi` devuelve `[]` si el día no pertenece a la semana cargada). Sin
  pendientes, el botón queda deshabilitado.
- La agenda del card no bloquea la página: el skeleton de pantalla completa sigue atado al
  resumen, y el estado de carga/error de la agenda se muestra dentro del card.

## Fuera de alcance

- Menú `...` por sesión: mover, cancelar y marcar confirmada (`PATCH /sessions/:id/move`,
  `POST /sessions/:id/confirm`, `POST /sessions/:id/cancel`). Es otra spec; el botón muerto se
  elimina en esta.
- Contadores clickeables o que sigan el día seleccionado.
- Vista/ruta propia de pendientes (por eso "Ver pendientes" reutiliza `/agenda`).
- Crear serie, bloquear cupos, editar plantilla/preferencias, altas de apoderado/niño.

## Criterios de aceptación

- [ ] En `/`, navegar entre días y semanas de "Mi agenda" muestra los cupos y sesiones de cada
      día (antes solo funcionaba el día de hoy).
- [ ] Se puede crear una cita desde los cuatro caminos, y tras crearla el cupo pasa a sesión, los
      contadores suben y aparece el movimiento en actividad reciente, sin recargar la página.
- [ ] Tras navegar a otra semana, "Nueva cita" abre un cupo de la semana visible, no de la actual.
- [ ] Con la semana sin cupos libres, las entradas de creación quedan deshabilitadas y nada
      crashea.
- [ ] Seleccionar el domingo indica que la plantilla no tiene horarios ese día, sin errores.
- [ ] "Ver pendientes" deja `/agenda` abierta en la semana y el día del primer pendiente.
- [ ] `/agenda` sigue comportándose igual que antes de extraer el `SlotRow` compartido.
- [ ] `pnpm check` y `pnpm build` en verde.
