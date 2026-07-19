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

## Composition and object style

`createAppRuntime()` is the manual composition root. It creates the object graph once, in dependency
order, before React renders. `AppRuntime` is the narrow set of root dependencies published through
focused providers; it is not a service locator and feature code never receives the complete runtime.

- Ports remain TypeScript interfaces.
- Stateful HTTP adapters and application services are constructor-injected classes implementing
  those interfaces.
- React components, hooks, composition factories, Query configuration, DTO mappings, and pure
  domain operations remain functions.
- A class is introduced for meaningful dependency ownership, state, identity, or lifecycle, not just
  because code lives outside React.

This gives object-graph nodes an explicit shape without wrapping the generated API client or pure
operations in ceremonial classes. Construction remains visible in `app/composition.ts`; no class
resolves dependencies from a global container.

`pnpm architecture` enforces these import directions and rejects circular dependencies. The rules
live in `.dependency-cruiser.cjs`, making the dependency rule executable rather than conventional.

## State ownership

| State | Owner |
| --- | --- |
| Projects and tasks returned by the API | TanStack Query |
| Current authenticated user | TanStack Query session cache |
| OIDC protocol, tokens, and session cookie | ASP.NET authentication adapter |
| Selected resource and shareable filters | Router path/search parameters |
| Form values and validation | React Hook Form |
| Other local interaction state | React |
| Stable gateways and services | `AppRuntime` through focused dependency contexts |

Server data is never copied into a second global client store. The current user and feature data are
shared through focused Query hooks backed by one `QueryClient`; repeated consumers subscribe to the
same cached data rather than issuing independent requests. React Context distributes stable injected
services, not frequently changing feature data. Crossing into an anonymous session clears
authenticated Query data while preserving the session query.

When state must be shared across components, choose its owner by meaning rather than reach:

1. Keep API-derived data in Query and let every consumer subscribe through a feature hook.
2. Put selected resources, filters, sorting, and other shareable state in Router path/search params.
3. Keep form state in React Hook Form; use `FormProvider` only when one form spans a deep subtree.
4. Lift transient interaction state to the nearest common component that needs it.
5. Use a focused Context plus reducer for genuinely cross-tree client concerns such as theme or a
   notification queue. Place the provider at the narrowest route or application boundary.
6. Add a dedicated client-state library only after real, frequently changing, interconnected state
   makes focused React ownership unwieldy. It must not duplicate Query or Router state.

New application complexity should come from real capabilities. Project selection, task filters, and
task workflows naturally exercise URL, server, form, and local state without introducing a global
store or artificial examples.

A pathless authenticated route owns session loading, failure, anonymous, and ready rendering. Child
pages do not receive session props. Shared authenticated chrome reads the cached session at the route
boundary, and future authenticated routes inherit the same guard.

## Presentation organization

As a feature grows, presentation code is grouped by UI capability rather than technical file type.
Components, hooks, Query or mutation definitions, and tests that change together stay together in
folders such as `project-list` and `create-project`. Feature-wide page composition, cache keys, and
dependency contexts remain at the presentation root. Avoid broad `components`, `hooks`, `queries`,
and `mutations` folders that scatter one capability across the tree.

## Transport boundary

`openapi-typescript` generates `src/shared/api/schema.d.ts` from the running .NET API. Generated
transport types stay inside HTTP adapters. Adapters map transport DTOs and RFC Problem Details into
frontend models and `AppError`; components do not import generated schemas or call `fetch`.

Authentication follows the same boundary. The session application layer depends on an
`AuthenticationGateway`; its HTTP adapter calls stable TaskFlow endpoints (`/api/auth/me`, login,
antiforgery, and logout). React and Query never import a provider SDK. ASP.NET owns the OIDC
protocol and an `HttpOnly` same-origin cookie, so replacing Keycloak with another OIDC provider does
not change frontend features.

Run the API before regenerating the contract:

```bash
pnpm generate:api
```

## Replaceability

Components consume focused feature hooks rather than raw TanStack Query result objects. Replacing
Query therefore changes presentation adapters, not application ports or HTTP adapters. Replacing
React requires a new presentation adapter, while domain models, ports, HTTP adapters, and application
services remain reusable.

Do not build a generic wrapper around every Query feature. Abstract feature intent (`ProjectsGateway`,
`useProjects`, `useCreateProject`) rather than recreating a universal cache API.
