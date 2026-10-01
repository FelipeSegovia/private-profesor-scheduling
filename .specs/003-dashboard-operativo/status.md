Estado: implementación completa (tareas 1-14), pendiente verificación manual
Última tarea completada: 14 (`pnpm check` y `pnpm build` en verde)
Siguiente: verificación visual en modo MSW (tarea 15) y, si el usuario levanta
`profesor-scheduling-api`, contra el backend real (tarea 16)

Notas:
- Hallazgo de la exploración: dos de las cuatro funcionalidades que el usuario pidió "agregar"
  ya estaban operativas con datos reales (contadores y actividad reciente). Lo que sí faltaba
  era el cableado de crear cita (4 botones muertos) y un bug en "Mi agenda": el card recibía
  solo `todaySessions`, por lo que navegar a otro día o semana mostraba siempre vacío.
- Decisiones del usuario: contadores solo con hints corregidos (no clickeables); "Mi agenda" con
  sesiones + cupos libres y botón "Agendar"; actividad reciente sin cambios; incluir
  "Ver pendientes"; dejar fuera el menú `...` por sesión (mover/cancelar/confirmar → spec futura).
- El diseño se validó con un agente aparte. Correcciones incorporadas: `isLoading` en vez de
  `isPending` para una query con `enabled`; derivar el cupo de "Nueva cita" de la semana visible
  y no del `nextFreeSlot` del backend (que siempre es de la semana actual); mostrar la fecha
  además de la hora en `SlotAndHours`; limpiar el `import type { Session }` al borrar
  `sessionDtoToSession` (por `noUnusedLocals`). Se descartó su propuesta de
  `DaySlot extends SlotRef`: por tipado estructural no hace falta.
- Ajuste no previsto en el plan: se propagó `past` a `DaySlot` (el backend ya lo manda en
  `SlotCell.past`) y se agregó `firstFreeSlot`, que exige `!past`. Sin eso, "Nueva cita" y los
  accesos rápidos podían auto-elegir un cupo libre ya vencido y fallar con `400 PAST_SLOT`.
- `AttentionCard` ganó estado vacío: antes, con 0 pendientes, mostraba el badge en 0, una lista
  vacía y el botón activo.
- Deuda preexistente detectada, **fuera del alcance de esta spec**: en `/agenda` (y ahora también
  en el card del home) un cupo libre cuya hora ya pasó sigue ofreciendo "Agendar", y el backend
  responde `400 PAST_SLOT` con el mensaje correcto. El dato para arreglarlo ya está en
  `DaySlot.past`; conviene resolverlo en la spec que toque los cupos.
- Verificación sin navegador (no había Chromium/Playwright disponible en el entorno): se ejecutó
  `daySlotsFromApi` + `daySummaryLabel` + `firstFreeSlot` sobre los fixtures reales de MSW. Los 7
  días de la semana devuelven sus cupos, el domingo cae en "Sin cupos en la plantilla",
  `firstFreeSlot` descartó el único cupo libre ya pasado de la semana y la semana siguiente
  carga. Falta el click-through visual del usuario.
