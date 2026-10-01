# Spec: Conectar el panel privado al backend real

## Objetivo

Reemplazar los tres endpoints inventados por el mock (`/api/summary`, `/api/agenda`,
`/api/preferences`) por el contrato real que expone `profesor-scheduling-api` bajo `/api/panel/*`
(spec `004-panel-educadora`, completada), agregar el login de la educadora que ese contrato
exige, y dejar el proyecto configurable entre MSW y el backend real vía variables de entorno.

## Contexto

`profesor-scheduling-api` expone 21 rutas del panel con JWT propio
(`EDUCATOR_JWT_SECRET`, distinto del apoderado). Ninguna de las rutas que este frontend consume
hoy existe en el servidor. Fuente del contrato:
[`../../profesor-scheduling-api/docs/API.md`](../../profesor-scheduling-api/docs/API.md) y el
código de `src/panel/` en ese repo (el `openapi.json` no sirve para generar tipos: usa
`interface` + Zod, no clases DTO, y `components.schemas` está vacío).

## Requisitos funcionales

- Login de la educadora contra `POST /api/panel/auth/login`; token en `localStorage`; rutas
  protegidas detrás de un guard que valida con `GET /api/panel/auth/me`.
- `GET /` (resumen) lee de `GET /api/panel/summary?date=`.
- `GET /agenda` lee de `GET /api/panel/agenda?weekStart=` (weekStart debe ser lunes; validar en
  cliente antes de pedir).
- `GET /preferencias` lee de `GET /api/panel/preferences`.
- Cliente HTTP único (`src/lib/api/client.ts`) que implementa el formato de error del backend
  (`{ error, code? }`), agrega el header `Authorization: Bearer <token>`, y reacciona a
  `401 NO_SESSION` cerrando la sesión local.
- Variables de entorno `VITE_API_BASE_URL` y `VITE_USE_MSW` (default: MSW activo) para elegir
  entre mock y backend sin tocar código.
- Puerto de desarrollo fijo en `5173` (`strictPort`).
- MSW actualizado a las formas reales del contrato (incluida la validación de que `weekStart`
  sea lunes), para que el modo mock siga sirviendo de verificación.

## Fuera de alcance

- Cualquier endpoint de escritura del panel (crear cita, serie, mover, confirmar, cancelar,
  bloquear cupos/días, editar plantilla o preferencias, fichas de apoderado/niño). Estos ya
  existen en el backend; se conectan en una spec `002` posterior.
- Recuperación de clave de la educadora (el backend no la tiene: es operativa vía
  `pnpm db:seed`).
- Ficha por alumno (fuera de alcance también en el backend).

## Criterios de aceptación

- [ ] Sin `.env.local`, `pnpm dev` abre en `http://localhost:5173` y usa MSW.
- [ ] Con otro proceso ocupando 5173, `pnpm dev` falla en vez de saltar de puerto.
- [ ] Login con credenciales inválidas muestra el error del backend (`INVALID_CREDENTIALS` /
      `MISSING_FIELDS`); con válidas, entra y persiste la sesión tras recargar.
- [ ] Sin token, cualquier ruta protegida redirige a `/login`.
- [ ] Con `VITE_USE_MSW=false` y el backend real levantado, las tres páginas muestran datos
      reales y ningún request sale con error de CORS.
- [ ] `/agenda` nunca pide un `weekStart` que no sea lunes.
- [ ] Cambiar la clave de la educadora invalida el token viejo (siguiente request da
      `401 NO_SESSION` y desloguea).
- [ ] `pnpm check` y `pnpm build` en verde.
