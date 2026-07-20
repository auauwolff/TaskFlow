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
- `app` is the composition root. It combines feature registrations and provides stable dependencies.

Layers are created inside a feature only when that feature has code for them. Empty ceremonial
layers are avoided.

## Composition and object style

`createAppRuntime()` is the application composition root. It registers shared infrastructure, invokes
each feature's `add*Module()` function, and builds the object graph before React renders. `AppRuntime`
contains the resulting immutable service resolver and Query client; feature code never receives the
complete runtime or resolver.

`shared/ioc` is a package-ready, framework-neutral typed container plus a thin React 19 bridge. Typed
symbol tokens avoid string collisions and decorators. The container rejects missing, duplicate, and
circular registrations, eagerly creates root singletons, prevents singletons from capturing scoped
services, supports child-scope overrides, and exposes singleton, scoped, and transient lifetimes.
React installs one `ServiceProvider`; focused feature hooks resolve only their own token.

Container builds eagerly initialize singleton and scoped instances before their resolver is provided
to React. `useService()` is therefore a pure stable read and rejects transient tokens; transient
services are for explicit resolution and construction graphs outside render. Service constructors
must remain side-effect-free. React Effects own subscriptions and other UI-tree resource lifecycles;
automatic container disposal is intentionally not part of the current package boundary.

The root `ServiceProvider` makes application singletons available to the complete UI tree. A route,
page, or module that needs an isolated lifetime wraps its subtree in `ServiceScopeProvider`. The child
scope inherits root services, creates its own scoped instances, and may override registrations without
changing its parent. Pass a stable resource identity as `scopeKey` when the scope must be rebuilt for a
different workspace:

```tsx
<ServiceScopeProvider
  scopeKey={projectId}
  configure={addProjectWorkspaceScope}
>
  <ProjectWorkspacePage />
</ServiceScopeProvider>
```

Scope configuration and constructors must be pure because React Strict Mode may evaluate initializers
more than once. Do not create a scope for ordinary component state, URL state, Query data, or forms.

- Ports remain TypeScript interfaces.
- Stateful HTTP adapters and application services are constructor-injected classes implementing
  those interfaces.
- React components, hooks, feature registration functions, Query configuration, DTO mappings, and
  pure domain operations remain functions.
- A class is introduced for meaningful dependency ownership, state, identity, or lifecycle, not just
  because code lives outside React.

This gives object-graph nodes an explicit shape without wrapping the generated API client or pure
operations in ceremonial classes. Root assembly remains visible in `app/composition.ts`, while each
feature owns its concrete registrations in `features/<feature>/composition.ts`. No global container
exists, and components cannot request the resolver directly.

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
| Stable gateways and services | Typed IoC registrations through focused feature hooks |

Server data is never copied into a second global client store. The current user and feature data are
shared through focused Query hooks backed by one `QueryClient`; repeated consumers subscribe to the
same cached data rather than issuing independent requests. The IoC React bridge distributes one
immutable service resolver, not frequently changing feature data. Crossing into an anonymous session
clears authenticated Query data while preserving the session query.

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
folders such as `project-list` and `create-project`. Feature-wide page composition, cache keys,
dependency tokens, and focused resolution hooks remain at the presentation root. Avoid broad
`components`, `hooks`, `queries`, and `mutations` folders that scatter one capability across the tree.

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
