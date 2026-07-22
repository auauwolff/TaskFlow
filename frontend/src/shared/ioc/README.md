# shared/ioc — a deliberate wheel

This package is a hand-rolled IoC container (~280 lines). That is normally a red flag, so this
document exists to state why the trade was made on purpose, and what would have to change for an
off-the-shelf container to win.

## Why not an existing container?

| Option | Why it loses here |
| --- | --- |
| `react-ioc` | Keys by concrete class, so consumers cannot depend on an interface/port — the one capability hexagonal architecture cannot give up. No lifetimes, no disposal, and provider lists are re-declared per component tree, so there is no single wiring source of truth. |
| `inversify`, `tsyringe` | Built around decorators and `reflect-metadata`: a global polyfill, emit-decorator compiler flags, and metadata retained on every class. They also resolve lazily by default, which is exactly the property React render purity cannot tolerate (see below). |
| React context per service | Works at small scale, but every service adds a provider, cross-service dependencies are wired by hand in JSX, and there are no lifetimes: nothing distinguishes "one per app" from "one per workspace", and nothing disposes anything. |

## The property none of them offer: render-safe resolution

React render must be pure. Instantiating a service — running a constructor, capturing
dependencies — is a side effect. A lazily-resolving container invoked from a component therefore
performs side effects during render, which Strict Mode is specifically designed to flush out.

This container splits resolution in two:

- **Creation is eager.** `build()` / `createScope()` instantiate every singleton and scoped
  registration up front (`initializeStableServices`).
- **Render is a read.** `useService` → `getStable` only reads the instance cache; it throws on
  transients and on anything not yet initialized, so a render can never trigger construction.

That guarantee is the container's reason to exist. The costs it buys are documented where they
live: eager scopes instantiate ancestor-scoped registrations their subtree may never use
(`core.ts`, `initializeStableServices`), and Strict Mode can discard one undisposed scope from the
`useState` initializer (`react.tsx`, `ServiceScope`) — which is why scoped constructors must be
resource-free.

## What it mirrors from .NET

The API is intentionally shaped like `Microsoft.Extensions.DependencyInjection`, so the frontend
and backend composition roots read the same way: `ServiceCollection` → `build()` →
singleton/scoped/transient lifetimes, scope validation (a singleton cannot capture a scoped
service), circular-dependency detection with a readable path, and reverse-order disposal.
`ServiceToken<T>` stands in for .NET's interface-keyed registration: a unique symbol carrying a
phantom type, which is how "register by interface" survives TypeScript's type erasure.

## Rules of thumb

- Register **singletons** for app-wide state (transports, gateways, application services).
- Register **scoped** for per-workspace state, created via `ServiceScopeProvider` with a
  `scopeKey` so a new key remounts the subtree against a fresh scope.
- Keep scoped constructors memory-only; acquire external resources lazily and release them in
  `dispose()`.
- **Transients** are never resolvable during render; resolve them inside handlers/effects and
  dispose them yourself.
