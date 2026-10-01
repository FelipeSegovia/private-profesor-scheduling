# Plan: Avisos en tiempo real en el panel

Diseño técnico de [`spec.md`](./spec.md). Estado previo: `001-conectar-panel` (cliente HTTP,
`authStore`, MSW con la forma real del contrato), `003-dashboard-operativo` (resumen y actividad) y
la spec `005-avisos-tiempo-real` de `profesor-scheduling-api` (stream y campana, completada).

## Archivos

```
src/lib/api/
  sse-parser.ts                  # NUEVO. parseSse(): puro, sin imports (se verifica con node)
  sse.ts                         # NUEVO. subscribeSse(): fetch + reconexión + 401
  panel.ts                       # + fetchNotifications, markNotificationsSeen
  queryKeys.ts                   # + notifications()
src/data/
  api-types.ts                   # + SessionEventKind, SessionEvent, NotificationItem, PanelNotificationsResponse;
                                 #   ActivityItem gana `startsAt`
  dashboard.ts                   # + chileDateFromIso (movido desde mocks/fixtures.ts, que lo importa)
  adapters/summary.ts            # exporta ACTIVITY_META y los formateadores que ya usa (sin cambiar su salida)
  adapters/notifications.ts      # NUEVO. notificationFromApi, toastMessageFor, slotLabel, relativeTime
  queries/useNotifications.ts    # NUEVO. useNotifications, useMarkNotificationsSeen
  queries/usePanelEvents.ts      # NUEVO. suscripción + invalidaciones + toasts
src/components/
  ui/sonner.tsx                  # NUEVO (shadcn), sin next-themes
  shared/ActivityIcon.tsx        # NUEVO. extraído de dashboard/RecentActivity.tsx
  dashboard/RecentActivity.tsx   # usa ActivityIcon compartido (sin cambio visual)
  layout/NotificationsBell.tsx   # NUEVO. Popover + lista
  layout/TopBar.tsx              # reemplaza el botón/punto fijo por <NotificationsBell />
  layout/AppShell.tsx            # monta usePanelEvents() y <Toaster />
src/mocks/
  notifications.ts               # NUEVO. estado en memoria, stream SSE, handlers, window.__panelMock
  handlers.ts                    # + ...notificationHandlers
```

Dependencia nueva: `sonner` (aprobada en la spec). Sin otras.

## Cliente del stream

### `sse-parser.ts` (puro)

```ts
export interface SseMessage { event: string; data: string; id?: string }
export function createSseParser(onMessage: (m: SseMessage) => void): (chunk: string) => void
```

Acumula en un buffer, normaliza `\r\n`/`\r` a `\n`, corta por `\n\n`, y de cada bloque toma las
líneas `event:` (por defecto `message`), `data:` (varias se unen con `\n`) e `id:`; ignora líneas
que empiezan con `:` (comentarios). Un bloque sin `data` no emite. Sin imports, para poder correrlo
con `node --experimental-strip-types` en la verificación (no hay test runner en esta app).

### `sse.ts`

```ts
export function subscribeSse(path: string, opts: {
  onEvent: (m: SseMessage) => void;   // ya sin `ping`
  onOpen?: (attempt: number) => void; // attempt = 0 la primera vez, ≥1 al reconectar
  signal: AbortSignal;
}): Promise<void>
```

Bucle `while (!signal.aborted)`:

1. `fetch(apiUrl(path), { headers: { Authorization, Accept: 'text/event-stream' }, signal })`, con el
   token de `getStoredToken()`. Sin token → termina sin reintentar.
2. `res.status === 401`: lee el cuerpo JSON; si `code === 'NO_SESSION'` llama
   `useAuthStore.getState().logout()` (misma regla que `client.ts`). Cualquier 4xx termina el bucle
   sin reintentar.
3. `res.ok`: `onOpen(attempt)`, `attempt++`, reinicia la espera a 1 s y lee `res.body` con
   `getReader()` + `TextDecoder({ stream: true })` alimentando el parser; descarta `ping`.
4. Fin del stream, error de red o 5xx: espera `delay` (1 s, 2 s, 4 s … tope 30 s, duplica en cada
   intento fallido, vuelve a 1 s tras una conexión que llegó a abrirse) y reintenta. La espera es
   cancelable por `signal`.
5. `AbortError` al abortar: sale en silencio, nunca reconecta.

`onOpen` recibe el número de aperturas previas para que el hook distinga primera conexión de
reconexión sin estado propio.

## Reacción a eventos (`usePanelEvents`)

```ts
useEffect(() => {
  const controller = new AbortController();
  void subscribeSse('/api/panel/events', {
    signal: controller.signal,
    onOpen: (n) => { if (n > 0) invalidateAll(); },     // reconexión
    onEvent: (m) => { if (m.event === 'session') handle(JSON.parse(m.data)); },
  });
  return () => controller.abort();
}, [queryClient]);
```

- El efecto no depende del token: `AppShell` solo existe autenticado y se desmonta al cerrar
  sesión (`RequireAuth` redirige), lo que aborta el stream. Si el token cambia con el shell
  montado (cambio de clave), la conexión sigue con el anterior hasta cortarse; al reconectar usa el
  nuevo (`getStoredToken()` se lee en cada intento).
- `handle(event)`: `invalidateQueries` de `["summary"]`, `["agenda"]`, `["notifications"]`, y
  `["guardians"]`/`["guardian"]` si `kind === 'CREATED'`. Toast si
  `actor !== 'EDUCATOR' && kind !== 'MOVED'`, con `toastMessageFor(event)`.
- `JSON.parse` dentro de `try/catch`: un mensaje mal formado se ignora (no tumba el stream).
- **StrictMode** (dev): monta, desmonta y vuelve a montar; el primer efecto se aborta antes de
  conectar de verdad y el segundo hace una sola conexión efectiva. Como `attempt` es local a cada
  llamada de `subscribeSse`, la apertura del segundo efecto sigue siendo "primera" (sin refresco
  espurio).
- Una sola instancia: el hook se llama únicamente desde `AppShell`, nunca desde páginas.

## Textos y formatos (`adapters/notifications.ts`)

- `slotLabel(startsAt)`: `Intl.DateTimeFormat('es-CL', { timeZone: 'America/Santiago', weekday: 'short',
  day: 'numeric', month: 'short' })` con `formatToParts`, quitando puntos y comas, más la hora
  (reutiliza el `timeFormatter` de `summary.ts`): `"mar 7 oct · 19:00"`.
- `toastMessageFor(event)`: los cuatro textos de la spec, con `event.childName` y `slotLabel`.
- `notificationFromApi(item)`: `{ id, kind (visual, de ACTIVITY_META), text, relative, unread, sessionId, startsAt }`.
  Depende de que `ActivityItem` traiga `startsAt` (ver "Prerrequisito en la API"). El texto incluye
  el cupo, igual que el toast: `"Sofía confirmó su cita del mar 7 oct · 19:00"`.
- `relativeTime(iso, now = Date.now())`: `Intl.RelativeTimeFormat('es-CL', { numeric: 'auto' })`
  ("hace 5 min", "ayer"); pasada una semana, la fecha corta. Se calcula al renderizar.
- Se exporta `ACTIVITY_META` desde `summary.ts` en lugar de duplicarlo; la salida del resumen no
  cambia.

### Prerrequisito en la API

`NotificationItem` (`ActivityItem & { unread }`) no traía `startsAt`, pero la spec pide navegar a la
semana de la cita y mostrar el cupo en cada aviso. Decisión (aprobada): agregar `startsAt` (ISO) a
`ActivityItem` en `profesor-scheduling-api`. Es un campo nuevo, no cambia ni quita nada; también
aparece en `activity` de `GET /api/panel/summary`, y el adaptador del resumen lo ignora. Se
implementa como adenda a la spec `005-avisos-tiempo-real` de la API (tarea 14 de su `tasks.md`) y es
la **tarea 1** de este plan; el resto depende de ella (los tipos de `api-types.ts` ya lo incluyen).

## Campana (`NotificationsBell`)

- `useNotifications()`: `useQuery({ queryKey: queryKeys.notifications(), queryFn: fetchNotifications })`.
  Se consulta desde el montaje del shell (la campana está siempre en el `TopBar`).
- `useMarkNotificationsSeen()`: `useMutation(markNotificationsSeen)` con actualización optimista:
  `onMutate` cancela consultas de `["notifications"]`, guarda el valor previo y pone
  `unreadCount: 0`; `onError` restaura el previo; sin `invalidate` en `onSuccess` (evita que la lista
  cambie bajo el popover abierto).
- Estado local del componente: `open` y `frozenUnread: Set<string>` (ids no leídos al momento de
  abrir). Al abrir: `frozenUnread = ids con unread`, y `mutate()`. Resaltado de un ítem mientras está
  abierto: `frozenUnread.has(id) || item.unread` (lo nuevo que llega con el popover abierto llega con
  `unread: true` porque es posterior a la marca recién puesta). Al cerrar: `frozenUnread` se vacía,
  si hubo ítems nuevos mientras estaba abierto se vuelve a llamar `mutate()`, y se invalida
  `["notifications"]` para reflejar el estado del backend.
- Insignia: sobre el ícono `Bell`, solo si `unreadCount > 0` (`9+` desde 10). `aria-label`:
  `"Notificaciones, N sin leer"` o `"Notificaciones"`.
- Lista (máx. 20, como entrega la API): `ActivityIcon` + texto + `relativeTime`; vacía →
  "No hay avisos nuevos". Estilos con los tokens de `AGENTS.md`.
- Clic en un ítem: cierra el popover, hace `setWeekStart(mondayOf(chileDate(item.startsAt)))` y
  `setSelectedDate(chileDate(item.startsAt))` del `useAgendaViewStore`, y `navigate('/agenda')`.
- `PopoverContent` por defecto es `w-72`; se amplía con `className` (`w-80`) y se limita la altura con
  scroll interno.

## Toasts

`pnpm dlx shadcn@latest add sonner` genera `ui/sonner.tsx`, que por defecto importa `useTheme` de
`next-themes` (no está instalado ni hace falta: la app no tiene modo oscuro conmutable). Se edita el
archivo generado para quitar esa dependencia y fijar el tema claro; si el generador agrega
`next-themes` a `package.json`, se retira. `<Toaster position="bottom-right" />` en `AppShell`, con
`duration={6000}`.

## Mocks (MSW)

`src/mocks/notifications.ts`:

- Estado: `items: NotificationItem[]` (semilla: la actividad de `buildSummary(todayChileYmd())`
  sin actor `EDUCATOR`, convertida a `NotificationItem`, todos no leídos; `buildSummary` ya debe
  poner `startsAt: cell.session.startsAt` en cada `ActivityItem` de `fixtures.ts`), `seenAt: Date | null`, y
  `streams: Set<ReadableStreamDefaultController<Uint8Array>>`.
- `GET /api/panel/notifications`: valida `Authorization` como los demás handlers; recalcula `unread`
  por `at > seenAt` (todo si es nulo), recorta a 20, cuenta `unreadCount` sobre toda la lista.
- `POST /api/panel/notifications/seen`: `seenAt = new Date()`, 204.
- `GET /api/panel/events`: `401 NO_SESSION` sin token; si no, `HttpResponse` con un `ReadableStream`
  y headers `Content-Type: text/event-stream`, `Cache-Control: no-cache`. Registra su controlador en
  `streams`, manda un `ping` cada 25 s (`setInterval`) y limpia al cancelarse o al abortar
  `request.signal`.
- `emitMockEvent(partial)`: completa `SessionEvent` (defaults: `kind 'CREATED'`, `actor 'GUARDIAN'`,
  `childName 'Niño de prueba'`, `startsAt` = mañana 19:00 Chile, `at` = ahora, `sessionId` aleatorio),
  agrega el ítem a la lista si `actor !== 'EDUCATOR'` y escribe `event: session` en cada stream.
- `window.__panelMock = { emit: emitMockEvent }`, asignado al importarse el módulo; como `browser.ts`
  solo se importa con MSW activo (`main.tsx`, import dinámico), no existe en un build de producción.
  Con `declare global` para el tipo.

## Verificación

No hay test runner. Se verifica así:

1. **Parser** (puro): script en el scratchpad con `node --experimental-strip-types` que importa
   `sse-parser.ts` y cubre: mensaje simple, `\r\n`, chunk partido a mitad de línea y a mitad de
   mensaje, `data` multilínea, comentario `:`, bloque sin `data`, `id`.
2. `pnpm check` y `pnpm build` tras cada tarea.
3. **MSW** (`pnpm dev`, `VITE_USE_MSW=true`): en la consola del navegador
   `__panelMock.emit({ kind: 'CREATED' })` → toast, insignia, refresco; luego `CONFIRMED`,
   `CANCELLED`, `NOT_CONFIRMED`; con `actor: 'EDUCATOR'` no hay toast.
4. **Backend real**: `profesor-scheduling-api` en `pnpm start:dev`, panel con `VITE_USE_MSW=false`.
   Con el resumen abierto, reservar con `curl` (o con la web pública en el puerto 5174) →
   toast + resumen/agenda actualizados + insignia. Confirmar con el enlace (token en la respuesta de
   la reserva) → segundo aviso. Cerrar el panel, reservar, reabrir → no leído. Apagar y levantar la
   API → reconexión con espera creciente y refresco al volver (pestaña *Network*). Token borrado de
   `localStorage` → vuelve a `/login` sin bucle. Cerrar sesión → el stream desaparece de *Network*.
   Los datos de prueba creados en la base de desarrollo se borran al terminar.
