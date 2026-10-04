# Spec: Familias y ficha clínica en el panel

## Objetivo

Agregar al panel una sección **Familias**:
- Una lista de apoderados con buscador.
- La ficha de cada apoderado: sus datos y, por cada niño, su ficha clínica.
- En la ficha clínica, la educadora crea, edita y borra registros, elige si cada registro nuevo
  se envía al apoderado por correo y exporta el historial del niño a PDF.

Backend: spec `007-ficha-clinica` de `profesor-scheduling-api`. Antes de tipar algo, el contrato
se revisa en `../../../profesor-scheduling-api/docs/API.md` y en `openapi.json`, no en los mocks.

Estado: **aprobada** por el usuario (2026-10-03). Depende de la 007 de la API.

## Requisitos funcionales

### 1. Navegación

- **Rutas nuevas:** `/familias` y `/familias/:guardianId`, ambas protegidas como el resto.
- **Sidebar** (`src/components/layout/Sidebar.tsx`): enlace "Familias" entre "Mi agenda" y
  "Preferencias".

### 2. Lista de familias (`/familias`)

- **Buscador** por nombre o email, con debounce, usando `useGuardians(query)`.
- **Cada fila:** nombre del apoderado, email, teléfono, cantidad de niños y sesiones activas.
- **Navegación:** un clic lleva a `/familias/:id`.
- **Estados:** cargando (skeleton), vacío ("Aún no hay familias registradas") y error.

### 3. Ficha del apoderado (`/familias/:guardianId`)

- **Encabezado:** nombre, email y teléfono (solo lectura en esta spec).
- **Una pestaña por niño:** nombre y edad, y la cantidad de registros (`notesCount`).
- **Dentro de cada pestaña:**
  - Sesiones del niño (desde `useGuardianDetail`, filtradas por `childId`), con fecha, hora y
    estado.
  - **Ficha clínica:** registros del más reciente al más antiguo, con fecha, título, texto
    (respetando saltos de línea), la sesión vinculada si la tiene y la marca "Enviado al
    apoderado" si `guardianNotified`.
- **Si el apoderado no tiene niños:** mensaje en lugar de pestañas.

### 4. Crear, editar y borrar registros

- **Formulario** (dialog) con:
  - Fecha (hoy por defecto).
  - Título (máximo 120 caracteres).
  - Texto (textarea).
  - Sesión opcional: un select con las sesiones de ese niño, más "Ninguna".
- **Al crear:** el formulario agrega la casilla "Enviar este registro a <apoderado> por correo",
  **marcada por defecto**.
- **Al editar:** no hay casilla, y se avisa que el correo no se reenvía.
- **Borrar** pide confirmación. Si el registro se envió, la confirmación aclara que el apoderado
  ya lo recibió.
- **Al terminar:** un toast (`sonner`) y se invalidan las notas del niño y el detalle del
  apoderado (por `notesCount`).
- **Errores del backend** (`ApiError.message`) se muestran en el formulario.

### 5. Exportar PDF

- **Botón** "Exportar PDF" en la pestaña del niño.
- **Descarga:** `fetch` con `Bearer`, luego `Blob`, `URL.createObjectURL` y un `<a download>`
  temporal. El nombre del archivo sale del `Content-Disposition`.
- **Durante la descarga:** el botón muestra el estado de carga. Si falla, aparece un toast de
  error.

### 6. Capa de datos

- **`src/lib/api/client.ts`:** agregar `patch`, `del` y `getBlob`, con el mismo manejo de 401 y
  de `ApiError`.
- **`src/lib/api/panel.ts`:** `listChildNotes`, `createChildNote`, `updateNote`, `deleteNote` y
  `downloadChildNotesPdf`.
- **Hooks:** en `src/data/queries/`, con keys en `src/lib/api/queryKeys.ts`.
- **Tipos:** en `src/data/api-types.ts`, copiados del contrato de la API.
- **MSW:** handlers con fixtures en memoria. El PDF del mock devuelve un PDF mínimo fijo.
- **UI que falta:** `textarea`, `select` y `checkbox` (shadcn sobre `@base-ui/react`, como el
  resto).

## Fuera de alcance

- Editar los datos del apoderado o del niño desde esta pantalla (la API ya lo permite; va en otra
  spec).
- Crear familias desde aquí.
- Reenviar un correo.
- Vista previa del PDF dentro del panel.

## Criterios de aceptación

- [ ] "Familias" en el sidebar. La lista busca y navega a la ficha.
- [ ] La ficha muestra los datos del apoderado y una pestaña por niño, con sus sesiones y sus
      registros.
- [ ] Crear con la casilla marcada deja `guardianNotified` y el correo aparece en el log de la
      API (sin `RESEND_API_KEY`). Con la casilla desmarcada no hay correo.
- [ ] Editar y borrar funcionan, y la lista se actualiza sin recargar.
- [ ] Exportar descarga un PDF que se abre, contra la API real.
- [ ] Funciona con MSW (`VITE_USE_MSW` activo) y contra la API real.
- [ ] `pnpm build` y Biome en verde.
