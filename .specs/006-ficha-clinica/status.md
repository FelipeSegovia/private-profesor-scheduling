Estado: completada
Última tarea completada: 10
Siguiente: nada de esta spec. Fuera de alcance y pendiente en otra spec: editar los datos del apoderado y del niño y crear familias desde Familias.
Notas:
- `spec.md` aprobada (2026-10-03). `plan.md` y `tasks.md` se escribieron el mismo día, a pedido del usuario ("Hazlo ahora"), que pidió pasar directo a implementar.
- Backend: spec `007-ficha-clinica` de `profesor-scheduling-api` (completada); contrato en su `docs/API.md`.
- Entregado: rutas `/familias` y `/familias/:guardianId` (pestaña por niño en `?nino=`), enlace "Familias" en el sidebar y breadcrumb, crear/editar/borrar registros, exportar PDF, MSW con la forma real del contrato (registros en memoria y PDF mínimo), y `textarea`, `checkbox` y `select` (nativo) en `ui/`.
- Verificado: `pnpm build` y `pnpm exec biome check .` (queda un aviso que ya existía, `noNonNullAssertion` en `main.tsx`). No hay runner de tests en esta app: la verificación funcional fue con Playwright (scripts en el scratchpad de la sesión, no en el repo).
  - **Contra MSW** (Vite en el puerto 5191): sidebar → lista, buscador y estado sin resultados, dos pestañas por niño con `?nino=` y recarga, validación de cliente, casilla de correo marcada por defecto, crear con y sin correo, `notesCount` de la pestaña, editar (sin casilla y con aviso), exportar PDF, borrar con el aviso de "ya se envió", apoderado sin niños y apoderado inexistente, y 390 px sin scroll horizontal. Consola sin errores.
  - **Contra la API real** (puerto 3058, base `agendamientos_test`, `RESEND_API_KEY=""` forzada, Vite en 5192): mismo recorrido con una sesión real vinculada. Un solo correo `Nuevo registro en la ficha de Ana Playwright` en el log de la API (editar no reenvía), PATCH 200, DELETE 204, PDF real con `ficha-ana-playwright-<fecha>.pdf` que se abre con el título editado y la sesión vinculada.
- Hallazgos al verificar:
  - **Bug real en la API, corregido:** el navegador no dejaba leer `Content-Disposition` entre orígenes, así que el panel caía al nombre de respaldo (`ficha-Ana Playwright.pdf`). La API ahora lo expone por CORS (`src/common/cors.ts`, ver su spec 007). El respaldo del panel además arma un nombre equivalente (`ficha-<slug>-<fecha>.pdf`).
  - `Button render={<Link />}` sin `nativeButton={false}` hacía que Base UI avisara en la consola. Corregido en `GuardianPage.tsx`.
  - Los tres fallos restantes de la primera pasada eran condiciones de carrera del script (esperas), no del código.
- No se hizo commit.
