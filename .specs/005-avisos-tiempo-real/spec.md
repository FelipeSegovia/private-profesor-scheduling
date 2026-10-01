# Spec: Avisos en tiempo real en el panel

## Objetivo

Que la educadora, con el panel abierto, se entere al instante —sin recargar— cuando un apoderado
reserva, confirma o cancela, y que la campana de la barra superior muestre lo no visto aunque el
panel haya estado cerrado. Conecta la interfaz con lo que ya expone `profesor-scheduling-api`
(spec `005-avisos-tiempo-real` de ese repo, completada).

## Contexto

Hoy la campana de `src/components/layout/TopBar.tsx` es decorativa: un punto rojo fijo, sin acción.
El resumen y la agenda solo se actualizan al recargar, al volver el foco a la ventana o tras una
escritura propia (`useCreateSession`, `useUpdatePreferences`).

Regla de negocio: [`../../../docs/mvp/REQUERIMIENTOS_FUNCIONALES.md`](../../../docs/mvp/REQUERIMIENTOS_FUNCIONALES.md),
sección "Avisos en el panel". Es un aviso dentro del panel, **no** un correo; las reglas de correo
no cambian. Contrato (fuente de la verdad, no los mocks):
[`../../../profesor-scheduling-api/docs/API.md`](../../../profesor-scheduling-api/docs/API.md),
sección "Avisos en tiempo real". `openapi.json` no trae `components.schemas`, así que los tipos se
copian a mano a `src/data/api-types.ts` (patrón de siempre en esta app).

Contrato exacto usado por esta spec:

- `GET /api/panel/events` — Server-Sent Events (`text/event-stream`), `Authorization: Bearer`.
  - **No se puede usar `EventSource`**: no admite headers y el token no debe ir en la URL. Se abre
    con `fetch` y se lee `response.body`.
  - `event: session` con `data` = `SessionEvent`:
    `{ id, kind: 'CREATED'|'CONFIRMED'|'CANCELLED'|'NOT_CONFIRMED'|'MOVED', sessionId, childName, startsAt, actor: 'GUARDIAN'|'EDUCATOR'|'SYSTEM', at }`
    (`startsAt` y `at` en ISO UTC).
  - `event: ping` con `data: {}` cada 25 s.
  - Sin token o con token inválido: `401 { error, code: 'NO_SESSION' }` en JSON, sin abrir el stream.
  - **No hay reproducción** de eventos perdidos (`Last-Event-ID` se ignora). Lo ocurrido mientras no
    había conexión se pierde: al reconectar hay que volver a pedir resumen, agenda y notificaciones.
  - El token se valida solo al abrir: si vence con el stream abierto, este sigue hasta cortarse y la
    reconexión recibe 401.
  - `SessionEvent.id` es `${sessionId}:${kind}` y **no es único en el tiempo** (`MOVED` se repite): no
    deduplicar por `id`. Tampoco coincide con `ActivityItem.id` (el alta de la campana usa `…:created`).
- `GET /api/panel/notifications` → `200 { items: NotificationItem[], unreadCount: number }` con
  `NotificationItem = ActivityItem & { unread: boolean }` (`ActivityItem` ya existe en
  `api-types.ts`). Hasta 20 ítems, más recientes primero, **sin** lo que hizo la propia educadora;
  `unreadCount` cuenta toda la ventana, no solo los `items` devueltos. Cada sesión aporta su alta y
  solo su último cambio de estado.
- `POST /api/panel/notifications/seen` → `204`. Marca todo como visto hasta ese instante.

## Requisitos funcionales

### 1. Cliente del stream

- `src/lib/api/sse.ts`: `subscribeSse(path, { onEvent, onOpen, signal })`.
  - `fetch(apiUrl(path))` con `Authorization: Bearer` (mismo origen del token que
    `src/lib/api/client.ts`: `getStoredToken`), `Accept: text/event-stream`, sin `credentials`.
  - Lee `response.body` con `getReader()` + `TextDecoder` y parsea el formato SSE (líneas `event:`,
    `data:`, `id:`; mensajes separados por línea en blanco; tolera `\r\n` y chunks partidos a mitad
    de línea o de mensaje). Ignora `ping` hacia afuera (solo sirve para mantener la conexión).
  - Reconexión automática si la conexión se corta o falla (red, 5xx, fin del stream): espera
    exponencial 1 s → 2 s → 4 s … hasta 30 s, y vuelve a 1 s tras una conexión que llegó a abrirse.
  - `401 NO_SESSION`: igual que `client.ts`, cierra la sesión local (`useAuthStore.getState().logout()`)
    y **no reintenta**. Otros 4xx tampoco reintentan.
  - Se cancela limpiamente con `AbortSignal` (sin reconectar tras abortar).
- Sin dependencias nuevas para esto.

### 2. Reacción a los eventos

- Hook `src/data/queries/usePanelEvents.ts`, montado **una sola vez** en `AppShell`
  (que solo se renderiza autenticado, detrás de `RequireAuth`) y que se desmonta al cerrar sesión.
- Por cada `SessionEvent`, sea cual sea su `actor`, invalida: `["summary"]`, `["agenda"]` y
  `["notifications"]`; y `["guardians"]`/`["guardian"]` cuando `kind === 'CREATED'` (una reserva
  pública puede crear apoderado y niño). Así otras pestañas de la misma educadora también se
  refrescan.
- Al **reconectar** (cualquier apertura después de la primera, no la primera) invalida lo mismo una
  vez, porque pudo perderse algo durante el corte.
- Aviso emergente (toast) solo si `actor !== 'EDUCATOR'` y `kind !== 'MOVED'`. Textos en español, con
  el nombre del niño y el cupo en hora de Chile (`America/Santiago`, ej. "mar 7 oct · 19:00"):
  - `CREATED` → "Nueva reserva: {niño}, {cupo}"
  - `CONFIRMED` → "{niño} confirmó su cita del {cupo}"
  - `CANCELLED` → "{niño} canceló su cita del {cupo}"
  - `NOT_CONFIRMED` → "Se liberó el cupo de {niño} ({cupo}) por falta de confirmación"
- No se deduplican eventos por `id`. Varios avisos seguidos se apilan (los maneja la librería de
  toasts); un toast desaparece solo a los ~6 s.

### 3. Toasts

- Se agrega `sonner` mediante shadcn (`src/components/ui/sonner.tsx`), con `<Toaster />` montado en
  `AppShell`, respetando la paleta de `AGENTS.md`. **Es una dependencia nueva**: requiere
  aprobación explícita de esta spec, y hay que sumarla a "Herramientas instaladas" de `AGENTS.md`
  y `CLAUDE.md`.

### 4. Campana

- `TopBar.tsx`: el botón "Notificaciones" abre un `Popover` (ya existe `ui/popover.tsx`) con la lista.
- Datos: `useNotifications()` (`GET /api/panel/notifications`), con `queryKeys.notifications()`;
  se carga al montar el shell para poder mostrar el contador sin abrir nada.
- Indicador: insignia con `unreadCount` (`9+` si pasa de 9) **solo si es mayor que 0**; sin él, la
  campana queda limpia (reemplaza el punto rojo fijo). Con `aria-label` que incluya la cantidad.
- Lista: cada ítem muestra ícono por tipo (reutiliza el criterio visual de `RecentActivity`:
  confirmación, cancelación, no confirmada, nueva reserva), el texto del aviso, y la hora relativa
  del cambio. Los no leídos se distinguen visualmente. Vacía: "No hay avisos nuevos".
- Al abrir el popover se llama `POST /api/panel/notifications/seen` y la insignia baja a 0 de
  inmediato (actualización optimista de la caché). **Mientras el popover sigue abierto, los ítems
  conservan su estilo de no leído** (se muestra una foto de la lista al abrir); al cerrarse, se
  refresca desde el backend. Si `seen` falla, se restaura el contador y no se muestra error
  intrusivo.
- Si llega un evento con el popover abierto, la lista se refresca y el aviso nuevo aparece como no
  leído; como ya se llamó a `seen` al abrir, se vuelve a marcar visto al cerrar.
- Clic en un ítem: cierra el popover y navega a `/agenda` en la semana de esa cita
  (`useAgendaViewStore.setWeekStart` / `setSelectedDate`, con `mondayOf` de `data/dashboard.ts`).
- Accesible por teclado (el `Popover` de base-ui ya maneja foco y Escape).

### 5. Tipos y adaptadores

- `src/data/api-types.ts`: `SessionEventKind`, `SessionEvent`, `NotificationItem`,
  `PanelNotificationsResponse` (copiados del contrato, `ActivityItem`/`Actor` ya existen).
- `src/lib/api/panel.ts`: `fetchNotifications()` y `markNotificationsSeen()`; `queryKeys.notifications()`.
- `src/data/adapters/notifications.ts`: traduce `NotificationItem` a un tipo de presentación
  (texto en español, tipo visual, hora). Reutiliza el mapeo de `kind` y el formato de hora que ya usa
  `adapters/summary.ts` en lugar de duplicarlos (extraer a una función compartida si hace falta).

### 6. Mocks (MSW)

- `GET /api/panel/notifications` y `POST /api/panel/notifications/seen` con estado en memoria
  (lista inicial derivada de la actividad de `fixtures.ts` sin los ítems de actor `EDUCATOR`;
  `seenAt` en memoria; misma regla de "no leído": posterior a `seenAt`, y todo si es nulo).
- `GET /api/panel/events` devuelve un `ReadableStream` SSE que manda `ping` periódicos y los eventos
  que se le inyecten.
- Ayuda **solo de desarrollo y solo con MSW activo**: `window.__panelMock.emit(partialEvent)`
  agrega el aviso a la lista en memoria y lo empuja por el stream, para ver toast, campana y
  refresco sin backend. No existe en un build de producción (MSW nunca arranca ahí).
- Misma validación de `Authorization` que el resto de los handlers (`401 NO_SESSION`).

### 7. Documentación

- `CLAUDE.md` de esta app: arquitectura (`sse.ts`, `usePanelEvents`, campana) y "Estado frente a los
  requerimientos".
- `AGENTS.md`: "Herramientas instaladas" (`sonner`) y, en "Qué puede hacer esta superficie", los
  avisos en vivo.
- `../CLAUDE.md` (raíz): la hoja de ruta marca los avisos como completos de punta a punta.

## Fuera de alcance

- Marcar leídas de a una, historial completo de avisos, página dedicada de notificaciones.
- Notificaciones push del navegador o del sistema operativo, y sonido.
- Indicador visible de "conexión perdida" (la reconexión es silenciosa; al volver, se refresca todo).
- Reproducción de eventos perdidos (el backend no la ofrece).
- Cambios en el backend o en `public-parents-scheduling-web/`.
- Acciones sobre la cita desde el aviso (confirmar, mover, cancelar): son features aparte.
- Tests automatizados de interfaz: esta app no tiene test runner; se verifica en el navegador
  (ver criterios).

## Criterios de aceptación

Con el backend real y con MSW (`VITE_USE_MSW`), salvo donde se indica:

- [x] Con el panel abierto en el resumen, una reserva pública (otra pestaña o la web pública)
      muestra el toast "Nueva reserva…", y el resumen y la agenda se actualizan sin recargar.
- [x] Confirmar y cancelar por el enlace del correo muestran sus toasts y actualizan el resumen.
- [x] Lo que hace la propia educadora (crear cita, mover, cancelar) **no** genera toast, pero otra
      pestaña suya sí se refresca.
- [x] La campana muestra la insignia con el número de no leídos y ninguna cuando es 0.
- [x] Abrir la campana baja la insignia a 0; los ítems siguen resaltados mientras está abierta y dejan
      de estarlo al reabrirla.
- [x] Con el panel cerrado, reservar y volver a abrirlo deja la reserva como no leída.
- [x] Un clic en un aviso lleva a `/agenda` en la semana de la cita.
- [x] Cortar la conexión (apagar y volver a levantar la API) reconecta sola con espera creciente y,
      al volver, resumen/agenda/notificaciones se actualizan.
- [x] Un token inválido (borrado o vencido) cierra la sesión y manda a `/login` sin reintentar en
      bucle.
- [x] Cerrar sesión corta el stream (no queda una conexión abierta en la pestaña *Network*).
- [x] Una sola conexión SSE por pestaña (no una por navegación entre rutas).
- [x] En MSW, `window.__panelMock.emit(...)` produce toast, insignia y refresco.
- [x] Sin cambios en el comportamiento de login, resumen, agenda y preferencias.
- [x] `pnpm check` y `pnpm build` en verde.
