# Tasks: Avisos en tiempo real en el panel

Orden de ejecución de [`plan.md`](./plan.md). Cada tarea deja el repo en verde (`pnpm check && pnpm build`). Actualizar [`status.md`](./status.md) al cerrar cada tarea. No hay test runner: cada tarea dice cómo se comprueba.

## Prerrequisito (en `profesor-scheduling-api`)

1. [x] **Agregar `startsAt` a `ActivityItem`** — es la tarea 14 de la spec `005-avisos-tiempo-real` de la API (ver su `tasks.md`): `SessionForActivity.startsAt`, `ActivityItem.startsAt` (ISO), `loadRecentActivity`, tests, `docs/API.md` y `openapi.json`. Se hace y se cierra allá; aquí solo se marca al terminar.

## Dependencia, tipos y cliente HTTP

2. [x] **Instalar `sonner`** con `pnpm dlx shadcn@latest add sonner` y dejar `src/components/ui/sonner.tsx` sin `next-themes` (tema claro fijo; retirar `next-themes` de `package.json` si el generador lo agregó). Comprobar: `pnpm build`.
3. [x] **Tipos y llamadas**: `src/data/api-types.ts` (`SessionEventKind`, `SessionEvent`, `NotificationItem`, `PanelNotificationsResponse`; `ActivityItem` gana `startsAt`), `fetchNotifications`/`markNotificationsSeen` en `src/lib/api/panel.ts`, `queryKeys.notifications()`. Mover `chileDateFromIso` de `src/mocks/fixtures.ts` a `src/data/dashboard.ts` (los fixtures lo importan) y poner `startsAt` en los `ActivityItem` de `buildSummary`. Comprobar: `pnpm build`; el resumen sigue viéndose igual.

## Cliente del stream

4. [x] **`src/lib/api/sse-parser.ts`**: `createSseParser`. Verificar con un script en el scratchpad (`node --experimental-strip-types`): mensaje simple, `\r\n`, chunk partido a mitad de línea y de mensaje, `data` multilínea, comentario `:`, bloque sin `data`, `id`.
5. [x] **`src/lib/api/sse.ts`**: `subscribeSse` con reconexión exponencial (1 s → 30 s), `401 NO_SESSION` → `logout()` sin reintento, otros 4xx sin reintento, cancelación por `AbortSignal`. Comprobar (script en el scratchpad con un servidor `node:http` que cierra el stream a propósito): reconecta con espera creciente, vuelve a 1 s tras una conexión abierta, no reconecta tras abortar.

## Textos y adaptadores

6. [x] **Extraer `ActivityIcon`** de `dashboard/RecentActivity.tsx` a `components/shared/ActivityIcon.tsx` (sin cambio visual) y exportar `ACTIVITY_META`/formateadores de `adapters/summary.ts` (su salida no cambia). Comprobar: el dashboard se ve igual.
7. [x] **`src/data/adapters/notifications.ts`**: `slotLabel`, `toastMessageFor`, `notificationFromApi`, `relativeTime`. Comprobar con un script en el scratchpad los cuatro textos de toast, el formato `"mar 7 oct · 19:00"` en `America/Santiago` (también a través del cambio de horario) y `relativeTime`.

## Mocks

8. [x] **`src/mocks/notifications.ts`** + handlers en `handlers.ts`: lista y `seenAt` en memoria, `GET /api/panel/notifications`, `POST /api/panel/notifications/seen`, `GET /api/panel/events` (stream con ping), `emitMockEvent` y `window.__panelMock`. Comprobar con `pnpm dev` (MSW): en la pestaña *Network* el stream queda abierto; `__panelMock` existe en consola y las dos rutas responden con `Authorization` y 401 sin él.

## Interfaz

9. [x] **Hooks**: `useNotifications`, `useMarkNotificationsSeen` (optimista con rollback, sin `invalidate` en `onSuccess`), `usePanelEvents` (invalidaciones, toast, refresco al reconectar). Comprobar: `pnpm build`.
10. [x] **Toasts**: montar `<Toaster />` y `usePanelEvents()` una sola vez en `AppShell`. Comprobar en MSW: `__panelMock.emit({ kind })` para `CREATED`, `CONFIRMED`, `CANCELLED`, `NOT_CONFIRMED` (toast con su texto), `actor: 'EDUCATOR'` y `kind: 'MOVED'` (sin toast); el resumen se refresca; una sola conexión en *Network* tras navegar entre rutas.
11. [x] **Campana**: `components/layout/NotificationsBell.tsx` (insignia con `9+`, `aria-label`, lista, vacía, resaltado con `frozenUnread`, `seen` al abrir y al cerrar si llegaron ítems, clic navega a la semana de la cita) y reemplazar el botón decorativo de `TopBar.tsx`. Comprobar en MSW: insignia, abrir la baja a 0, los ítems siguen resaltados mientras está abierta, clic lleva a `/agenda` en la semana correcta, Escape cierra, navegación por teclado.

## Documentación y cierre

12. [x] **Documentación**: `CLAUDE.md` de la app (arquitectura y estado), `AGENTS.md` (`sonner` en "Herramientas instaladas" y los avisos en "Qué puede hacer esta superficie"), `../CLAUDE.md` raíz (hoja de ruta: avisos completos de punta a punta).
13. [x] **Cierre y verificación contra el backend real**: `pnpm check` y `pnpm build` en verde; recorrer los criterios de aceptación de `spec.md` con MSW y con `profesor-scheduling-api` levantada (`VITE_USE_MSW=false`), incluidos reconexión (apagar y volver a levantar la API), token borrado, cierre de sesión y cierre/reapertura del panel. Borrar los datos de prueba creados en la base de desarrollo. Marcar los criterios.
