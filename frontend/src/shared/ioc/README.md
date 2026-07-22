# shared/ioc — a deliberate wheel

This package is a hand-rolled IoC container (~280 lines). That is normally a red flag, so this
document exists to state why the trade was made on purpose, and what would have to change for an
off-the-shelf container to win.

## Why not an existing container?

| Option | Why it loses here |
| --- | --- |
| `react-ioc` | Supports several binding forms, but MarineAid.Next predominantly keys by concrete class and distributes provider lists through the component tree. Its effective lifetime is one lazy cached instance per owning provider; it has automatic `dispose()` on unmount but no explicit singleton/scoped/transient model or captive-scope validation. |
| `inversify`, `tsyringe` | Built around decorators and `reflect-metadata`: a global polyfill, emit-decorator compiler flags, and metadata retained on every class. They also resolve lazily by default, which is exactly the property React render purity cannot tolerate (see below). |
| `brandi`, `typed-inject`, `awilix` | Credible decorator-free alternatives with different strengths. Brandi is the closest typed-token/React comparison, typed-inject provides stronger compile-time graph checks, and Awilix has mature scope/disposal semantics. This container stays deliberately smaller and prioritizes eager stable services, captive-scope validation, and explicit composition. |
| React context per service | Works at small scale, but every service adds a provider, cross-service dependencies are wired by hand in JSX, and there are no lifetimes: nothing distinguishes "one per app" from "one per workspace", and nothing disposes anything. |

## The distinguishing property: stable render-time resolution

React render must be pure. Instantiating a service — running a constructor, capturing
dependencies — is a side effect. A lazily-resolving container invoked from a component therefore
performs side effects during render, which Strict Mode is specifically designed to flush out.

This container splits resolution in two:

- **Creation is eager.** `build()` / `createScope()` instantiate every singleton and scoped
  registration up front (`initializeStableServices`). Root composition happens before React starts;
  `ServiceScopeProvider` currently creates its scope while rendering the provider itself.
- **Render is a read.** `useService` → `getStable` only reads the instance cache; it throws on
  transients and on anything not yet initialized, so a render can never trigger construction.

That stable-read guarantee is the container's reason to exist, but it does not make managed scope
creation fully render-pure. Eager scopes instantiate ancestor-scoped registrations their subtree
may never use (`core.ts`, `initializeStableServices`), and Strict Mode or an abandoned concurrent
render can discard one scope from the `useState` initializer without running effect cleanup
(`react.tsx`, `ServiceScope`). Scoped constructors must therefore remain synchronous, cheap, and
resource-free. An externally created scope passed through `ServiceProvider` is the safe primitive
when the owner needs complete lifecycle control; alternate managed-scope semantics remain a future
React lifecycle experiment.

## What it mirrors from .NET

The API is intentionally shaped like `Microsoft.Extensions.DependencyInjection`, so the frontend
and backend composition roots read the same way: `ServiceCollection` → `build()` →
singleton/scoped/transient lifetimes, scope validation (a singleton cannot capture a scoped
service), circular-dependency detection with a readable path, and reverse-order disposal.
`ServiceToken<T>` stands in for .NET's interface-keyed registration: a unique symbol carrying a
phantom type, which is how "register by interface" survives TypeScript's type erasure.

Container construction is transactional for retained services: if eager initialization fails,
already-created singleton/scoped instances are disposed before the original failure is rethrown.
Resolution failures expose typed errors with token and dependency-path metadata.

Scopes are caller-owned. Disposing a parent makes all descendants unusable — `isUsable()` turns
false and resolution throws — and prevents inherited singletons from being recreated, but it does
not dispose child resources: an invalidated child still reports `isDisposed()` false and holds its
instances until its owner calls `dispose()`. Dispose children before their parent, and never guard
`dispose()` behind `!isUsable()`. `value()` is also caller-owned and is never disposed by the
container. Register a pre-created container-owned object with `singleton(token, () => value)`
instead. The same owned instance returned by multiple registrations in one container is disposed
once; an instance aliased across parent and child containers is not deduplicated — each container
disposes what it created.

The React adapter deliberately has a narrow managed-lifecycle contract. `ServiceProvider.services`
and `ServiceScopeProvider.configure` remain stable while mounted; remount with a React `key` or
change `scopeKey` when their identity must change. Managed `ServiceScopeProvider` components cannot
be nested because Strict Mode can replay a child's effect before its parent has committed a rebuilt
scope. For nested ownership, create scopes explicitly and pass each one through `ServiceProvider` —
that boundary switches the subtree to the supplied container lineage, so managed scopes may appear
below it again. JSX placement does not establish container parentage; `createScope()` does. The
caller must keep the external scope and all of its actual ancestors usable until descendants
unmount, then dispose the external scope explicitly.

## Rules of thumb

- Register **singletons** for app-wide state (transports, gateways, application services).
- Register **scoped** for per-workspace state, created via `ServiceScopeProvider` with a
  `scopeKey` so a new key remounts the subtree against a fresh scope.
- Keep scoped constructors memory-only; acquire external resources lazily and release them in
  `dispose()`.
- **Transients** are never resolvable during render; resolve them inside handlers/effects and
  dispose them yourself.
