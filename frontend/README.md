# TaskFlow Frontend

React and TypeScript client for TaskFlow. Vite handles development and production builds,
TanStack Router provides type-safe file-based routing, TanStack Query owns API state, and XState
models the authentication workflow. See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the
feature-first Hexagonal Architecture boundaries.

## Commands

Run these commands from this directory:

```bash
pnpm install
pnpm dev
pnpm lint
pnpm architecture
pnpm test
pnpm build
```

The development server proxies `/api` to the ASP.NET API at `http://localhost:5131`, so start the
backend before using the connected screens.

Authentication uses same-origin TaskFlow endpoints. ASP.NET performs the OIDC flow and stores the
session in an `HttpOnly` cookie; no provider SDK or token is exposed to frontend JavaScript.

`pnpm preview` uses the same local proxy. A deployed static build must be served behind a reverse
proxy that forwards `/api` to ASP.NET; the frontend container will provide that in the Compose step.

To regenerate typed transport contracts from the running API:

```bash
pnpm generate:api
```

Route files live in `src/routes`. The TanStack Router Vite plugin generates
`src/routeTree.gen.ts`; do not edit that file manually.
