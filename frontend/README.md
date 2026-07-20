# TaskFlow Frontend

React and TypeScript client for TaskFlow. Vite handles development and production builds,
TanStack Router provides type-safe file-based routing, TanStack Query owns API state, and React Hook
Form owns form interaction state. See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the feature-first
Hexagonal Architecture boundaries.

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

Stable application services are composed through the typed container in `src/shared/ioc`. The app
composition root registers shared infrastructure and invokes feature-owned `add*Module()` functions;
React receives the resulting graph through one service provider. See `ARCHITECTURE.md` for lifetime,
token, nested `ServiceScopeProvider`, state-ownership, and dependency-boundary rules.

## Browser tests

Playwright exercises the real browser, API, PostgreSQL database, and Keycloak login flow. Install its
Chromium build once, then run the suite:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

`test:e2e` starts disposable PostgreSQL and Keycloak containers on ports `55432` and `18080`, applies
migrations, starts the API on `15131` and Vite on `15173`, and removes the containers afterward. It
does not use or delete the normal development volumes and can run beside the development stack.

Use `pnpm test:e2e:ui` for Playwright UI mode. Browser tests live in `e2e/`; they verify public user
journeys, including deep-linked project/task workflows, and must not import application implementation
code.
