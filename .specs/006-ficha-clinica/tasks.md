# Tasks: Familias y ficha clínica en el panel

Orden de ejecución de [`plan.md`](./plan.md). Cada tarea deja la app en verde con `pnpm build && pnpm check`.
Actualizar [`status.md`](./status.md) al cerrar cada tarea.

## Base

1. [x] **Tipos y cliente HTTP.** Tipos nuevos en `api-types.ts`; `client.ts` con `request()` compartido,
   `patch`, `del` y `getBlob`; funciones en `panel.ts`; `queryKeys.childNotes`; `formatLongDateWithYear`.
2. [x] **MSW.** Registros y sesiones por niño en `fixtures.ts`, `notesCount` en el detalle del apoderado y
   los 5 handlers (con el PDF mínimo).
3. [x] **Hooks.** `useChildNotes`, `useCreateNote`/`useUpdateNote`/`useDeleteNote` y `useExportNotesPdf`.
4. [x] **UI.** `textarea`, `checkbox` y `select`.

## Pantallas

5. [x] **Navegación y lista.** Rutas, enlace "Familias" en el sidebar, breadcrumb y `FamiliesPage`.
6. [x] **Ficha del apoderado.** `GuardianPage` con datos y pestañas por niño (`?nino=`), y `ChildRecord`
   con sesiones y registros de solo lectura.
7. [x] **Crear, editar y borrar.** `NoteDialog` y `DeleteNoteDialog`, con toasts y errores del servidor.
8. [x] **Exportar PDF.** Botón con estado de carga y toast de error.

## Cierre

9. [x] **Documentación.** `CLAUDE.md` de la app (rutas, patrón de `getBlob`) y `status.md`.
10. [x] **Cierre.** `pnpm build`, `pnpm check`; pasada con Playwright contra MSW y contra la API real.
