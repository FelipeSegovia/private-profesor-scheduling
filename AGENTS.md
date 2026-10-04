# AGENTS.md

Contexto para agentes que trabajan en la **superficie privada** del MVP: agenda autenticada de la educadora.

Fuente canónica de reglas de negocio: [docs/mvp/REQUERIMIENTOS_FUNCIONALES.md](../docs/mvp/REQUERIMIENTOS_FUNCIONALES.md) y [docs/mvp/FUERA_DEL_MVP.md](../docs/mvp/FUERA_DEL_MVP.md). Si hay conflicto, prevalecen esos documentos. El contexto del apoderado está en [AGENTS_PUBLIC.md](../AGENTS_PUBLIC.md).

Fuente canónica del contrato HTTP: [profesor-scheduling-api/docs/](../profesor-scheduling-api/docs/) (`API.md` + `openapi.json`), no los mocks de esta app. El panel de la educadora vive bajo `/api/panel/*`, con JWT propio (`EDUCATOR_JWT_SECRET`, distinto del del apoderado) — ver `.specs/004-panel-educadora/` en ese repo.

## Specs

Las specs de trabajo están en la carpeta local [`.specs/`](.specs/). Antes de implementar, lee la spec, el plan, las tareas y el estado de ese cambio. Las plantillas están en [`.specs/_templates/`](.specs/_templates/).

## Quién es el usuario

- Educadora diferencial. Un solo acceso con usuario y clave: el de ella.
- Zona horaria: `America/Santiago`.
- No exponer nombres de niños ni apoderados en la página pública.

## Qué puede hacer esta superficie

1. Configurar la plantilla semanal (inicial: lunes a viernes 19:00 y 20:00; sábado 9:00, 10:00 y 11:00; duración fija 1 hora), editarla y bloquear solo un día o cupo vacío. Cambiar la plantilla no borra sesiones ya creadas; solo afecta cupos libres hacia adelante.
2. Mantener fichas reutilizables de apoderado (nombre, email, teléfono) y niño (nombre, edad). Una sesión pertenece a un solo niño. Desde aquí puede guardar una edad fuera de 3 a 13.
3. Crear cita única: el correo al apoderado sale al instante.
4. Crear serie semanal con fecha de inicio y término. Se salta la fecha ocupada o bloqueada y ella ve cuáles quedaron fuera. No hay series sin fin. Mover o cancelar una sesión no altera el resto.
5. Mover una sesión a un cupo libre. El cupo anterior queda libre y se reenvía el correo; si el plazo de la nueva hora ya venció, queda `confirmada`.
6. Cancelar una sesión en cualquier momento antes de su hora.
7. Marcar `confirmada` a mano (aviso por WhatsApp) mientras la sesión siga `pendiente`.
8. Configurar plazo de confirmación (inicial 24 h) y antelación del correo de serie (inicial 48 h). El aviso tiene que salir antes de que venza el plazo; si no, no guardar la configuración.
9. Recibir avisos en el panel, en tiempo real y en la campana, cuando un apoderado reserva, confirma o cancela, o cuando un cupo se libera por falta de confirmación. No hay aviso por lo que ella misma hace en su agenda. Es un aviso dentro del panel, no un correo. Ver "Avisos en el panel" en `../docs/mvp/REQUERIMIENTOS_FUNCIONALES.md`.

## Correos a la educadora

Solo si el cambio no lo hizo ella misma en la agenda:

- El apoderado confirmó, o el sistema dejó la cita confirmada porque el plazo ya había vencido.
- El apoderado canceló (enlace No puedo o cancelación posterior).

No recibe correo por reserva nueva ni por liberación automática por falta de confirmación: eso se ve en la agenda y en los avisos del panel (punto 9 de arriba).

## Estados y cupos

- `no confirmada` (plazo vencido sin confirmar) y `cancelada` liberan el cupo y se conservan como historial.
- Un cupo está libre si no tiene sesión `pendiente` o `confirmada`.

## Familias y ficha clínica por niño

Sección Familias del panel: datos del apoderado y, dentro, la ficha clínica de cada niño (registros que ella escribe, con correo opcional al apoderado y exportación a PDF). Implementada en `.specs/006-ficha-clinica/` (backend: spec `007-ficha-clinica` de la API). Reglas en «Ficha clínica» de `../docs/mvp/REQUERIMIENTOS_FUNCIONALES.md`; no exponer nada en la superficie pública. Desde aquí aún no se editan los datos del apoderado ni del niño.

## Qué no implementar aquí

No agregar en esta superficie ni en el MVP:

- Precio, resumen de ingresos, WebPay, transferencia integrada o boleta.
- WhatsApp automático (API de Meta u otro proveedor).
- Reprogramación hecha por el apoderado (su cuenta opcional vive solo en la superficie pública).
- Duración distinta de 1 hora o más de una profesional.

## Paleta de colores

Fuente: `src/index.css` (`:root`). Usar estos tokens (`bg-background`, `text-foreground`, `bg-primary`, etc.). No inventar hex sueltos.

| Token | Valor | Uso |
| --- | --- | --- |
| `background` / `sidebar` | `#fff2eb` | Fondo de página |
| `foreground` | `#4a2430` | Texto principal |
| `card` / `popover` / `primary-foreground` | `#fffbfa` | Superficies claras y texto sobre primario |
| `primary` / `ring` | `#8e3048` | Acciones, foco y marca |
| `secondary` / `brand-soft` | `#ffebef` | Fondos suaves de marca |
| `muted` / `accent` | `#fee2e1` | Fondos atenuados y acento |
| `muted-foreground` | `#7d5560` | Texto secundario |
| `border` / `input` / `brand-selected` | `#fed8d2` | Bordes, inputs y selección |
| `destructive` | `oklch(0.577 0.245 27.325)` | Errores y acciones destructivas |

Tipografías: `DM Sans` (texto) y `Newsreader` (títulos). Radio base: `0.875rem`.

## Herramientas instaladas
- Shadcn para la reutilización de componentes.
- tailwindcss - estilos
- react router - para definir rutas
- msw - data mock local, con la forma real del contrato `/api/panel/*`
- @tanstack/react-query - fetching y cache de datos del servidor
- zustand - estado de UI (sesión, semana/día seleccionados)
- sonner - avisos emergentes (toasts) de los avisos en tiempo real; `components/ui/sonner.tsx` sin `next-themes` (tema claro fijo)
