import { useSignIn } from './useSignIn'

export function SignInPage() {
  const { error, isSigningIn, signIn } = useSignIn()

  return (
    <main className="onboarding page-frame">
      <section className="intro-panel">
        <p className="eyebrow">Your focused workspace</p>
        <h1>Turn plans into steady progress.</h1>
        <p className="summary">
          TaskFlow keeps identity at the boundary. Sign in securely, then organize projects and
          tasks without exposing provider details to the application.
        </p>
      </section>

      <section className="form-card">
        <div className="form-heading">
          <span className="step-number">01</span>
          <div>
            <h2>Enter your workspace</h2>
            <p>Continue through the configured OpenID Connect provider.</p>
          </div>
        </div>

        {error === null ? null : (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button
          className="primary-button"
          type="button"
          disabled={isSigningIn}
          onClick={() => signIn('/')}
        >
          {isSigningIn ? 'Redirecting...' : 'Sign in securely'}
        </button>
      </section>
    </main>
  )
}
