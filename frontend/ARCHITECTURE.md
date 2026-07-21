# Frontend Architecture

TaskFlow uses feature-first Hexagonal Architecture. The goal is to keep business concepts and
application workflows independent from React, HTTP, identity providers, and server-state libraries.

## Dependency rule

```text
app/composition
      |
      +-----------> presentation (React, Router, Query/MobX bindings)
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
contains the resulting immutable service resolver and TanStack Query client; feature code never receives the
complete runtime or resolver.

`shared/ioc` is a package-ready, framework-neutral typed container plus a thin React 19 bridge. Typed
symbol tokens avoid string collisions and decorators. The container rejects missing, duplicate, and
circular registrations, eagerly creates root singletons, prevents singletons from capturing scoped
services, supports child-scope overrides, and exposes singleton, scoped, and transient lifetimes.
React installs one `ServiceProvider`; focused feature hooks resolve only their own token.

Container builds eagerly initialize singleton and scoped instances before their resolver is provided
to React. `useService()` is therefore a pure stable read and rejects transient tokens; transient
services are for explicit resolution and construction graphs outside render. Service constructors
must remain side-effect-free. Scopes dispose owned singleton/scoped resources in reverse construction
order; React effects must start subscriptions because concurrent rendering may abandon constructors.

The root `ServiceProvider` makes application singletons available to the complete UI tree. A route,
page, or module that needs an isolated lifetime wraps its subtree in `ServiceScopeProvider`. The child
scope inherits root services, creates its own scoped instances, and may override registrations without
changing its parent. Pass a stable resource identity as `scopeKey` when the scope must be rebuilt for a
different workspace:

```tsx
<ServiceScopeProvider
  scopeKey={projectId}
  configure={addTasksWorkspaceScope}
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
| Projects returned by REST | TanStack Query |
| Tasks returned by GraphQL | TanStack Query |
| Current authenticated user | TanStack Query session cache |
| OIDC protocol, tokens, and session cookie | ASP.NET authentication adapter |
| Selected resource and shareable filters | Router path/search parameters |
| Form values and validation | React Hook Form |
| Project-scoped task filter | MobX view store |
| Other local interaction state | React |
| Stable gateways and services | Typed IoC registrations through focused feature hooks |

Server data is never copied into MobX. Projects, session, and tasks all use focused TanStack Query
hooks over their feature gateway; the REST and GraphQL transports feed the same single server-state
cache. Components consume TaskFlow-owned presentation models rather than the library's result objects.
The IoC React bridge distributes one immutable resolver and scoped view stores, not server data.
Crossing into an anonymous session clears authenticated Query data and the cached antiforgery token.

When state must be shared across components, choose its owner by meaning rather than reach:

1. Keep API-derived data in its feature's server-state engine and expose a focused feature hook.
2. Put selected resources, filters, sorting, and other shareable state in Router path/search params.
3. Keep form state in React Hook Form; use `FormProvider` only when one form spans a deep subtree.
4. Lift transient interaction state to the nearest common component that needs it.
5. Use a scoped MobX view store for interconnected workspace interactions and computed UI state.
6. Use a focused Context plus reducer for simple cross-tree concerns such as theme or notifications.
7. A client store must not duplicate Query, Router, or form state.

New application complexity should come from real capabilities. Project selection, task filters, and
task workflows naturally exercise URL, two transports behind one server-state engine, form state, and
a scoped MobX store without introducing a global application store.

A pathless authenticated route owns session loading, failure, anonymous, and ready rendering. Child
pages do not receive session props. Shared authenticated chrome reads the cached session at the route
boundary, and future authenticated routes inherit the same guard.

## Presentation organization

As a feature grows, presentation code is grouped by UI capability rather than technical file type.
Components, hooks, server-state operations, and tests that change together stay together in
folders such as `project-list` and `create-project`. Feature-wide page composition, cache keys,
dependency tokens, and focused resolution hooks remain at the presentation root. Avoid broad
`components`, `hooks`, `queries`, and `mutations` folders that scatter one capability across the tree.

## Transport boundary

Projects and session use REST. `openapi-typescript` generates `src/shared/api/schema.d.ts`; generated
transport types stay inside HTTP adapters. Adapters map transport DTOs and RFC Problem Details into
frontend models and `AppError`; components do not import generated schemas or call `fetch`.

Tasks deliberately use a second delivery path behind an identical seam. `TasksGateway`
(`features/tasks/application/ports.ts`) is a plain application port; its adapter
(`features/tasks/adapters/graphqlTasksGateway.ts`) posts typed task operations to `/api/graphql`,
where Hot Chocolate resolvers delegate to the same backend `ITaskService` used by REST controllers.
The GraphQL library is deliberately demoted to a transport: `shared/graphql/client.ts` is a tiny typed
`fetch` client carrying the same antiforgery header and 401 policy as the REST client, so the adapter
maps GraphQL enum, ID, and date values into the frontend task model exactly as the REST adapter maps
Problem Details. The same-origin cookie and antiforgery header protect both transports.

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

Projects and tasks intentionally demonstrate different transports behind the same architecture.
Both expose a feature gateway port (`ProjectsGateway`, `TasksGateway`) whose adapter owns the
transport — REST for projects, GraphQL for tasks — while both features drive a single TanStack Query
cache through focused hooks. Swapping a feature's transport (REST for GraphQL, or vice versa) replaces
only its adapter; its gateway port, presentation hooks, component contract, and domain model are
untouched. This is the payoff of the port seam: the heterogeneous transports prove the boundary is
real, not that two server-state caches coexist.

Do not build a generic wrapper around Query or MobX. Abstract feature intent (`ProjectsGateway`,
`useProjects`, `useTasks`, `TasksWorkspaceViewStore`) rather than recreating a universal cache API.
