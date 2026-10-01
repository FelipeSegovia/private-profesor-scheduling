Estado: implementación completa (tareas 1-12), pendiente verificación manual
Última tarea completada: 12 (`pnpm check` sin errores y `pnpm build` en verde)
Siguiente: click-through en modo MSW (tarea 13) y contra el backend real (tarea 14)

Notas:
- Decisiones del usuario: alcance plantilla + plazos (bloqueos fuera, van en `/agenda`);
  edición de la plantilla día a día en un diálogo, no un guardado global.
- El backend no valida `end > start` en `PUT /api/panel/template`: la validación queda en el
  cliente (`validateWorkDay`).
- Rango de horas de los selects aprobado con el spec: inicio 07:00–22:00, término hasta 23:00.
  Si un día ya tiene una hora fuera de ese rango, el select la incluye para no perderla.
- `pnpm check` deja 1 warning preexistente (`noNonNullAssertion` en `src/main.tsx`), no de esta spec.
- Mocks: la plantilla y los plazos son estado en memoria (`mockSchedule` en `fixtures.ts`). La
  agenda mock muestra una sesión activa aunque su hora salga de la plantilla (igual que el
  backend). `orphanSessions` del mock es una aproximación (reservas activas de la semana actual,
  no pasadas, fuera de la plantilla).
- Verificación sin navegador: se ejecutaron los helpers y las funciones del mock con `tsx`.
  Martes 18:00–21:00 da 3 cupos y aparece en la agenda; sábado desactivado queda `available:
  false`; domingo activado genera cupos; quitar el viernes con una reserva `PENDING` futura da
  `orphanSessions = 1` y la reserva sigue en la agenda; término = inicio, serie ≤ confirmación y
  horizonte 60 devuelven el error local/`INVALID_PREFERENCES`/`INVALID_RANGE` esperado.
  Falta el click-through visual y la prueba contra el backend real.
- Detalle de UX a revisar en el click-through: los avisos de huecos (este día / otros días) y el
  aviso de `orphanSessions` (desaparece al abrir otra edición).
