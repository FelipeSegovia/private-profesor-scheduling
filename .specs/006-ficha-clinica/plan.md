# Plan: Familias y ficha clínica en el panel

Diseño técnico de [`spec.md`](./spec.md). El contrato sale de
`../../../profesor-scheduling-api/docs/API.md` (sección "Ficha clínica") y de la spec `007-ficha-clinica` de
ese repo (completada).

## Archivos

```
src/lib/api/
  client.ts                      # refactor: request() compartido; + patch, del, getBlob
  panel.ts                       # + listChildNotes, createChildNote, updateNote, deleteNote, downloadChildNotesPdf
  queryKeys.ts                   # + childNotes(childId)
src/data/
  api-types.ts                   # PanelChildDto gana notesCount?; + ClinicalNote*, ChildNotesResponse, bodies
  dashboard.ts                   # + formatLongDateWithYear
  queries/useChildNotes.ts       # NUEVO
  queries/useNoteMutations.ts    # NUEVO. useCreateNote, useUpdateNote, useDeleteNote
  queries/useExportNotesPdf.ts   # NUEVO
src/components/
  ui/textarea.tsx, checkbox.tsx, select.tsx   # NUEVOS (select nativo con el estilo de Input)
  families/FamiliesPage.tsx      # NUEVO. Lista + buscador
  families/GuardianPage.tsx      # NUEVO. Datos del apoderado + pestañas por niño
  families/ChildRecord.tsx       # NUEVO. Contenido de una pestaña: sesiones + ficha clínica + PDF
  families/NoteDialog.tsx        # NUEVO. Crear y editar
  families/DeleteNoteDialog.tsx  # NUEVO
  layout/Sidebar.tsx             # + "Familias"
  layout/AppShell.tsx            # + breadcrumb de /familias
src/App.tsx                      # + rutas /familias y /familias/:guardianId
src/mocks/
  fixtures.ts                    # + registros y sesiones por niño; notesCount en el detalle
  handlers.ts                    # + 5 handlers (y PDF mínimo)
```

## Decisiones

- **Un solo `request()`** en `client.ts` para JSON y para binarios: el manejo del `Bearer`, del `401
  NO_SESSION` y de `ApiError` no se duplica. `getBlob` devuelve `{ blob, filename }`; el nombre sale de
  `Content-Disposition` (el backend lo manda en ASCII, sin `filename*`).
- **La pestaña activa vive en la URL** (`/familias/:id?nino=<childId>`): se puede recargar y enlazar.
  Sin `?nino=` o con uno que no es de ese apoderado, se muestra el primer niño.
- **Invalidaciones:** crear, editar o borrar invalidan `childNotes(childId)` y `guardian(guardianId)` (por
  `notesCount`). No tocan agenda ni resumen: no cambian sesiones.
- **Formulario:** validación de cliente igual a la del backend (título 1–120, texto 1–10.000, fecha
  obligatoria), pero el mensaje del servidor manda si llega un error. `notifyGuardian` solo existe al
  crear, marcado por defecto. Al editar se avisa que no se reenvía.
- **Select de sesión:** un `<select>` nativo (accesible, sin JS extra) con las sesiones del niño que ya
  vienen en `GET /guardians/:id`; la primera opción es "Ninguna". Se ordenan de la más reciente a la más
  antigua.
- **Estados de sesión:** el backend manda el enum en inglés; se traduce con `STATUS_MAP` de
  `data/adapters/summary.ts` y se pinta con `StatusBadge`.
- **Fechas:** los `YYYY-MM-DD` se formatean con `formatLongDateWithYear` (sin pasar por `Date` con zona
  horaria). "Hoy" por defecto en el formulario es `todayChileYmd()`.
- **PDF:** `fetch` con `Bearer` → `Blob` → `URL.createObjectURL` → `<a download>` temporal →
  `URL.revokeObjectURL`. Con MSW el handler devuelve un PDF mínimo válido.
- **Sin runner de tests** en esta app: se verifica con `pnpm build`, `pnpm check` y una pasada con
  Playwright contra MSW y contra la API real (ver la memoria del proyecto sobre puertos).

## Verificación end-to-end

1. `pnpm build` y `pnpm check` en verde.
2. Con MSW: Familias → apoderado con dos niños → crear, editar, borrar, exportar.
3. Contra la API real (puerto libre, `RESEND_API_KEY` vacía, base de test): crear con correo y ver el
   correo en el log de la API; exportar y abrir el PDF.
