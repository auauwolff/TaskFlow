/* oxlint-disable react/only-export-components -- Route modules export TanStack's route contract. */
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useSession, useSignOut } from '@/features/session'
// SignInPage is imported directly, not through the front door: it is a page, and the page layer
// mounts pages. Routing it through the barrel would defeat the router's code splitting.
import { SignInPage } from '@/features/session/presentation/sign-in/SignInPage'

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const session = useSession()
  const signOut = useSignOut()

  if (session.status === 'anonymous') return <SignInPage />

  if (session.status === 'failed') {
    return (
      <main className="centered-state page-frame">
        <p className="eyebrow">Session unavailable</p>
        <h1>We could not restore your workspace.</h1>
        <p className="summary">{session.message}</p>
        <button className="primary-button" type="button" onClick={session.retry}>
          Try again
        </button>
      </main>
    )
  }

  if (session.status === 'loading') {
    return (
      <main className="centered-state page-frame">
        <p className="eyebrow">Restoring workspace</p>
        <div className="loading-mark" aria-label="Loading" />
      </main>
    )
  }

  return (
    <main className="workspace page-frame">
      <section className="workspace-heading">
        <div>
          <p className="eyebrow">{session.user.email}</p>
          <h1>{session.user.name}&apos;s projects</h1>
        </div>
        <button
          className="text-button"
          type="button"
          disabled={signOut.isSigningOut}
          onClick={signOut.signOut}
        >
          {signOut.isSigningOut ? 'Logging out...' : 'Log out'}
        </button>
      </section>

      {signOut.error === null ? null : (
        <p className="form-error" role="alert">
          {signOut.error}
        </p>
      )}

      <Outlet />
    </main>
  )
}
