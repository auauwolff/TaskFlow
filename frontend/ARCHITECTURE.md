# Frontend Architecture

TaskFlow uses feature-first Hexagonal Architecture. The goal is to keep business concepts and
application workflows independent from React, HTTP, identity providers, and server-state libraries.

## Dependency rule

```text
app/composition
      |
      +-----------> presentation (React, Router, Query bindings)
      |                         |
      +-----------> adapters ---+---> application ports ---> domain
```

- `domain` contains models and pure policies. It imports no outer layer.
- `application` defines use-case contracts and ports. It may import `domain`.
- `adapters` implement ports using HTTP or browser APIs.
- `presentation` adapts application capabilities to React through focused view-model hooks.
- `app` is the composition root. It constructs adapters and provides stable dependencies.

Layers are created inside a feature only when that feature has code for them. Empty ceremonial
layers are avoided.

`pnpm architecture` enforces these import directions and rejects circular dependencies. The rules
live in `.dependency-cruiser.cjs`, making the dependency rule executable rather than conventional.

## State ownership

| State | Owner |
| --- | --- |
| Projects and tasks returned by the API | TanStack Query |
| Authentication workflow and current user | XState session actor |
| OIDC protocol, tokens, and session cookie | ASP.NET authentication adapter |
| Selected resource and shareable filters | Router path/search parameters |
| Form values and local interaction state | React |
| Stable gateways and services | Application dependency context |

Server data is never copied into a second global client store. XState models workflows, not the
API cache. React Context distributes stable dependencies and the session actor, not frequently
changing feature data. Crossing into the anonymous session state clears authenticated Query data.

## Transport boundary

`openapi-typescript` generates `src/shared/api/schema.d.ts` from the running .NET API. Generated
transport types stay inside HTTP adapters. Adapters map transport DTOs and RFC Problem Details into
frontend models and `AppError`; components do not import generated schemas or call `fetch`.

Authentication follows the same boundary. The session application layer depends on an
`AuthenticationGateway`; its HTTP adapter calls stable TaskFlow endpoints (`/api/auth/me`, login,
antiforgery, and logout). React and XState never import a provider SDK. ASP.NET owns the OIDC
protocol and an `HttpOnly` same-origin cookie, so replacing Keycloak with another OIDC provider does
not change frontend features.

Run the API before regenerating the contract:

```bash
pnpm generate:api
```

## Replaceability

Components consume feature-owned view models rather than TanStack Query result objects. Replacing
Query therefore changes presentation adapters, not page components or application ports. Replacing
React requires a new presentation adapter, while domain models, ports, HTTP adapters, and
core XState machines remain reusable.

Do not build a generic wrapper around every Query feature. Abstract feature intent (`ProjectsGateway`,
`useProjectsPageModel`) rather than recreating a universal cache API.
