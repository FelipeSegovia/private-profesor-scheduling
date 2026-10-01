# Spec: Preferencias editables (plantilla por día + plazos)

## Objetivo

Permitir a la educadora modificar desde `/preferencias` su disponibilidad día a día (plantilla
semanal) y los tres plazos configurables, usando los endpoints reales que ya expone
`profesor-scheduling-api` (spec `004-panel-educadora`, completada).

## Contexto

`PreferencesPage.tsx` hoy solo lee `GET /api/panel/preferences` y muestra la jornada por día y
los plazos, sin ninguna acción. Fuente del contrato:
[`../../../profesor-scheduling-api/docs/API.md`](../../../profesor-scheduling-api/docs/API.md)
y el código de `src/panel/schedule/` y `src/domain/{schedule,preferences}.ts` en ese repo
(`openapi.json` no trae `components.schemas`).

Contrato exacto usado por esta spec:

- `PUT /api/panel/template` — body `{ workWeek: [{ weekday: 0..6 /* 0 = domingo */, available: boolean, start: "HH:00" | null, end: "HH:00" | null }] }`
  → 200 `{ workWeek: WorkDayView[], orphanSessions: number }`.
  - **Reemplaza la plantilla completa**: se mandan siempre los 7 días.
  - `end` es exclusivo: `19:00`–`21:00` = cupos `19:00` y `20:00`. El backend solo lee la hora.
  - El backend **no** valida `end > start`: un rango vacío o invertido deja el día sin cupos
    sin error. La validación es responsabilidad del cliente.
  - Solo admite un rango contiguo por día. Un día que hoy tiene huecos (`contiguous: false`)
    queda con el rango completo si se reenvía con su `start`/`end`.
  - No toca sesiones ya creadas. `orphanSessions` = sesiones activas futuras cuya hora quedó
    fuera de la plantilla nueva.
- `PUT /api/panel/preferences` — body `{ confirmationDeadlineHours, seriesNoticeHours, bookingHorizonWeeks }`
  → 200 `PanelPreferencesResponse`.
  - 400 `INVALID_RANGE`: algún valor no es entero, `confirmationDeadlineHours < 1`, o
    `bookingHorizonWeeks` fuera de 1–52.
  - 400 `INVALID_PREFERENCES`: `seriesNoticeHours <= confirmationDeadlineHours` (el correo de
    serie tiene que salir antes de que venza el plazo; regla de `docs/mvp/`).
  - Si falla, no se guarda nada.

## Requisitos funcionales

### Plantilla por día

- Cada fila de la card "Horarios" tiene un botón **Editar** que abre un diálogo para ese día.
- El diálogo permite:
  - Activar o desactivar el día ("Atiende este día").
  - Elegir hora de inicio y hora de término (horas enteras, selects nativos). Inicio de
    `07:00` a `22:00`; término de inicio + 1 h a `23:00`.
  - Ver un preview: "19:00 – 21:00 · 2 cupos de 1 hora".
- Validación local antes de enviar: si el día está activo, término > inicio.
- Al guardar, se envía la semana completa con solo ese día cambiado.
- Avisos en el diálogo:
  - Fijo: "Cambiar la jornada no borra sesiones ya agendadas; solo cambia los cupos libres".
  - Si **ese** día tiene huecos: lista las horas actuales y avisa que se guardará el rango completo.
  - Si **otro** día tiene huecos: avisa que también se rellenarán al guardar (limitación del
    endpoint, que reemplaza la semana entera).
- Tras éxito: cierra el diálogo, actualiza la caché de preferencias con la respuesta e invalida
  agenda y resumen. Si `orphanSessions > 0`, aviso en la card: "N sesiones futuras quedaron
  fuera del horario; siguen agendadas".

### Plazos

- La card "Plazos" tiene un botón **Editar plazos** que abre un diálogo con los tres valores
  (`Input type="number"`, enteros).
- Validación local espejo de la del backend (mismos casos y mensajes en español).
- Errores del backend (`INVALID_RANGE`, `INVALID_PREFERENCES`) se muestran con su mensaje.
- Tras éxito: cierra, actualiza la caché de preferencias e invalida agenda y resumen (el
  horizonte cambia qué cupos aparecen como `BEYOND_HORIZON`).

### Mocks

- MSW: `PUT /api/panel/template` y `PUT /api/panel/preferences` con las mismas reglas y
  códigos que el backend. La plantilla y los plazos del mock pasan a ser estado en memoria, y
  `GET /api/panel/agenda` / `GET /api/panel/preferences` los leen, para que editar un día se
  vea en `/agenda` en modo mock.

## Fuera de alcance

- Bloquear o desbloquear un día o cupo concreto (`/api/panel/blocks/*`): va en `/agenda`, spec futura.
- Más de un rango por día (el backend no lo admite).
- Cambiar la duración de la sesión (fija en 1 hora, regla del MVP).
- Cambios de reglas de negocio: `docs/mvp/` no se toca.

## Criterios de aceptación

- [ ] Editar un día activo a otro rango actualiza la fila (rango y cantidad de cupos) y la agenda.
- [ ] Desactivar un día lo deja como "No trabaja" y sin cupos en la agenda.
- [ ] Activar un día que no se trabajaba (p. ej. domingo) crea sus cupos.
- [ ] No se puede guardar con término ≤ inicio (error local, sin llamar al backend).
- [ ] Guardar un día no altera los otros (salvo el aviso de huecos, si aplica).
- [ ] Si quedan sesiones futuras fuera de la plantilla, se muestra el aviso con `orphanSessions`.
- [ ] Plazos: serie ≤ confirmación muestra el error de `INVALID_PREFERENCES` y no guarda.
- [ ] Plazos: horizonte fuera de 1–52 o confirmación < 1 muestra el error de `INVALID_RANGE`.
- [ ] Plazos válidos se guardan y la card muestra los valores nuevos.
- [ ] Todo funciona igual en modo MSW y contra el backend real.
- [ ] `pnpm check` y `pnpm build` en verde.
