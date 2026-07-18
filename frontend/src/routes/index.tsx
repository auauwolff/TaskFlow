/* oxlint-disable react/only-export-components -- Route modules export TanStack's route contract. */
import { createFileRoute } from '@tanstack/react-router'
import { ProjectsPage } from '@/features/projects/presentation/ProjectsPage'
import { OnboardingPage } from '@/features/session/presentation/OnboardingPage'
import { useSession } from '@/features/session/presentation/useSession'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const session = useSession()

  if (session.status === 'anonymous')
    return (
      <OnboardingPage
        error={session.error}
        isCreating={session.isCreating}
        onCreate={session.createUser}
      />
    )

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

  if (session.status === 'ready')
    return (
      <ProjectsPage
        user={session.user}
        sessionError={session.error}
        onSignOut={session.signOut}
      />
    )

  return (
    <main className="centered-state page-frame">
      <p className="eyebrow">Restoring workspace</p>
      <div className="loading-mark" aria-label="Loading" />
    </main>
  )
}
