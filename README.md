# private-profesor-scheduling

Panel privado de la educadora. Vite + React 19 + TypeScript. Ver
[`CLAUDE.md`](./CLAUDE.md) y [`AGENTS.md`](./AGENTS.md) para arquitectura y reglas de producto.

## Instalar y correr

```bash
pnpm install
pnpm dev       # http://localhost:5173 (puerto fijo, falla si está ocupado)
```

Sin configurar nada, `pnpm dev` levanta con **MSW** (datos de prueba en el navegador, sin
backend). Credenciales de ese modo: cualquier correo y clave no vacíos.

## Backend real vs. mocks

```bash
cp .env.example .env.local
```

| Variable | Default | Efecto |
| --- | --- | --- |
| `VITE_USE_MSW` | `true` | `'false'` desactiva MSW; todas las peticiones van a `VITE_API_BASE_URL`. |
| `VITE_API_BASE_URL` | `http://localhost:3000` | Base del backend real (`profesor-scheduling-api`). Vacío = rutas relativas. |

Para usar el backend real: levantarlo aparte
([`profesor-scheduling-api/README.md`](../profesor-scheduling-api/README.md), puerto `3000` por
defecto, con CORS habilitado para `http://localhost:5173`), poner `VITE_USE_MSW=false` en
`.env.local`, y entrar con las credenciales de `SEED_EDUCATOR_EMAIL` /
`SEED_EDUCATOR_PASSWORD` de ese repo.

## Otros comandos

```bash
pnpm build     # tsc -b && vite build
pnpm check     # biome check .
pnpm preview
```

No hay test runner. Verificar en el navegador con `pnpm dev`.
