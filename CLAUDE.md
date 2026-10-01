# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Panel privado de la educadora: ve su agenda, crea citas y, próximamente, tendrá una ficha por cada alumno. Mapa general del proyecto en [`../CLAUDE.md`](../CLAUDE.md).

Reglas de la superficie, paleta y herramientas:
@AGENTS.md

## Comandos

```bash
pnpm dev        # Vite, puerto fijo 5173 (strictPort); arranca MSW antes de renderizar
pnpm build      # tsc -b && vite build
pnpm lint       # biome lint .
pnpm check      # biome check .
pnpm preview
```

No hay test runner. Verificar en el navegador con `pnpm dev`. La lógica pura (parser SSE, bucle de reconexión, textos de avisos) no importa `@/` ni `import.meta.env` y se puede ejecutar con `node --experimental-strip-types`: por eso `sse-parser.ts`, `sse-loop.ts` y `notification-text.ts` importan con extensión `.ts` (permitido por `allowImportingTsExtensions`). Cómo se verificó cada pieza: `.specs/005-avisos-tiempo-real/status.md`.

## Backend real vs. mocks

La fuente de la verdad del contrato HTTP es
[`profesor-scheduling-api/docs/`](../profesor-scheduling-api/docs/) (`API.md` y
`openapi.json`), no los mocks de esta app. El panel de la educadora vive bajo `/api/panel/*`
(spec `004-panel-educadora` de ese repo, completada), con JWT propio
(`EDUCATOR_JWT_SECRET`, distinto del del apoderado).

```bash
cp .env.example .env.local
```

| Variable | Default | Efecto |
| --- | --- | --- |
| `VITE_USE_MSW` | `true` | `'false'` desactiva MSW; todas las peticiones van a `VITE_API_BASE_URL`. |
| `VITE_API_BASE_URL` | `http://localhost:3000` | Base del backend real. Vacío = rutas relativas (necesario para que MSW intercepte). |

Con el backend real levantado (`profesor-scheduling-api`, puerto `3000`), entrar con las
credenciales de `SEED_EDUCATOR_EMAIL` / `SEED_EDUCATOR_PASSWORD` de ese repo (sembradas por
`pnpm db:seed`).

**Puerto fijo en 5173** (`vite.config.ts`, `strictPort: true`): el backend valida CORS contra
una lista fija (`CORS_ORIGINS`) que ya incluye `5173`. `public-parents-scheduling-web/` también
usa 5173 por defecto — si hay que levantar las dos apps a la vez, mover esa a 5174 (también
está en la allowlist del backend).

## Arquitectura

Vite + React 19 + TypeScript + Tailwind v4 + shadcn (sobre `@base-ui/react`) + react-router 8 + React Compiler + TanStack Query + Zustand. Alias `@` → `src/`.

- `src/App.tsx`: ruta pública `/login` y un guard (`RequireAuth`) que valida el token guardado contra `GET /api/panel/auth/me` antes de montar el resto de las rutas dentro de `AppShell` (`src/components/layout/`: `Sidebar`, `TopBar`).
  - `/` → `DashboardPage` (resumen: estadísticas, agenda del día, pendientes, actividad).
  - `/agenda` → `AgendaPage` (semana con cupos: sesión, libre, bloqueado o fuera del horizonte de reserva).
  - `/preferencias` → `PreferencesPage` (editable: jornada por día en `WorkDayDialog`, plazos en `DeadlinesDialog`; spec `004-preferencias-editables`).
  - Para agregar una sección: ruta en `App.tsx` y entrada en `mainNav`/`configNav` de `Sidebar.tsx`. `components/pages/PlaceholderPage.tsx` sirve para secciones aún vacías.
- `src/data/`: tipos y lógica de presentación, sin React.
  - `api-types.ts`: tipos del contrato `/api/panel/*`, copiados a mano del backend (su `openapi.json` no sirve para generar tipos: `components.schemas` está vacío).
  - `dashboard.ts`: `Educator`, `Session`, `SummaryResponse` (tipos de presentación, no del wire), helpers de fecha (`addDays`, `getWeekDays`, `mondayOf`, `sessionsForDate`).
  - `agenda.ts`: tipos de presentación de la agenda (`DaySlot`, `SlotKind`).
  - `adapters/summary.ts`, `adapters/agenda.ts`: traducen las respuestas del backend (dominio, en inglés, con `null`/`undefined` explícitos) a los tipos de presentación que consumen los componentes.
  - `preferences.ts`: lógica pura de la edición de preferencias (horas de los selects, payload de la semana completa, validación espejo de la del backend; `PUT /api/panel/template` no valida `end > start`).
  - `notification-text.ts`: textos y fechas puros de los avisos (`slotLabel` → `"lun 5 oct · 19:00"`, `notificationMessage`, `relativeTime`), todo en `America/Santiago`. `adapters/notifications.ts` los adapta (`notificationFromApi`, `toastMessageFor`).
  - `queries/`: hooks de TanStack Query (`useSummary`, `useAgenda`, `usePreferences`, `useMe`, `useNotifications`, `useMarkNotificationsSeen`, `usePanelEvents`) sobre `src/lib/api/panel.ts`.
- `src/lib/api/`: `client.ts` (fetch + `Authorization: Bearer`, formato de error `{error, code?}`, desloguea en `401 NO_SESSION`), `panel.ts` (una función por endpoint), `queryKeys.ts`, y el stream de avisos: `sse.ts` (cablea `env` y `authStore`), `sse-loop.ts` (reconexión) y `sse-parser.ts` (formato SSE).
- `src/store/`: `authStore.ts` (token en `localStorage`, perfil de la educadora), `agendaViewStore.ts` (semana/día seleccionados en la UI).
- **Avisos en tiempo real** (spec `005-avisos-tiempo-real`; backend: spec 005 de `profesor-scheduling-api`): `usePanelEvents()` se llama **una sola vez**, en `AppShell` (solo existe autenticado), y mantiene abierto `GET /api/panel/events` con `fetch` + `Authorization: Bearer` (no `EventSource`: no admite headers y el token no va en la URL). Cada `SessionEvent` invalida `summary`/`agenda`/`notifications` (y `guardians`/`guardian` si es `CREATED`) y muestra un toast (`sonner`, abajo a la derecha: arriba taparía la campana) salvo si `actor === 'EDUCATOR'` o `kind === 'MOVED'`. El stream no repite lo perdido: al reconectar se vuelve a pedir todo. Reconexión con espera de 1 s a 30 s; `401 NO_SESSION` cierra la sesión sin reintentar. En desarrollo ves 2 peticiones al stream y 1 abortada: es el doble montaje de StrictMode, queda una sola conexión. La campana (`components/layout/NotificationsBell.tsx`, en `TopBar`) marca todo visto al abrirse (`POST /api/panel/notifications/seen`, optimista) y conserva el resaltado de lo no leído mientras está abierta.
- `src/mocks/`: MSW con la forma real del contrato (`fixtures.ts` genera agenda/resumen/preferencias en base a la fecha real, no una fecha demo fija), para que el modo mock ejercite el mismo código que el backend real. `mocks/notifications.ts` simula la campana y el stream; con MSW activo, `window.__panelMock.emit({ kind, actor?, childName?, startsAt? })` dispara un aviso (toast, insignia y refresco) sin backend. Solo existe con MSW (nunca en un build de producción). Ojo: en modo mock los refrescos no cambian los datos del resumen/agenda, que son fixtures estáticos.

`SessionStatus` de presentación tiene 4 valores (`pendiente | confirmada | no confirmada | cancelada`); el backend manda el enum en inglés (`PENDING | CONFIRMED | NOT_CONFIRMED | CANCELLED`) y los adaptadores traducen. Los tipos de `src/data/` no se comparten con `public-parents-scheduling-web/src/domain/`. Al agregar estados o entidades, revisar la definición de `docs/mvp/` y la app pública para mantenerlos alineados.

## Estado frente a los requerimientos

El panel tiene login, lee resumen, agenda y preferencias del backend real (o de MSW, según
`VITE_USE_MSW`) y recibe avisos en tiempo real con campana (spec `005-avisos-tiempo-real`). Todavía no están implementados del lado de este frontend, aunque el backend ya
los expone bajo `/api/panel/*` (ver `AGENTS.md` para las reglas de cada uno):

- Crear cita única o serie, mover, cancelar, marcar confirmada, bloquear cupos.
- Fichas de apoderado y niño, y la **ficha por alumno** (próxima feature, además sin spec en el backend).

Cualquiera de estas es una feature de varias capas: requiere spec en `.specs/` (ver
`001-conectar-panel` para el patrón). Plantillas en `.specs/_templates/`.
