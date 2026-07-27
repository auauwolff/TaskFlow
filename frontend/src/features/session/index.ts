/**
 * The session feature's public API — the only surface another feature may import.
 *
 * Everything else under `features/session/` is internal: gateways, ports, query keys, and the
 * folder layout are free to change without touching a consumer. The `cross-feature-imports-use-
 * the-front-door` rule in `.dependency-cruiser.cjs` makes that enforceable rather than polite.
 *
 * `SignInPage` is deliberately absent. It is a page, and pages are mounted by the page layer
 * (`src/routes/`), which imports it directly. Re-exporting it here would pull it into the chunk of
 * every feature that only wanted `useCurrentUser`, quietly undoing the router's code splitting.
 */
export { transitionToAnonymousSession } from './presentation/current-session/sessionCache'
export { useCurrentUser, useSession, type SessionViewModel } from './presentation/current-session/useSession'
export { useSignOut } from './presentation/sign-out/useSignOut'
export type { User } from './domain/user'
