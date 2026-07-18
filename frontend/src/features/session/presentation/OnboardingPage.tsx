import { useState, type FormEvent } from 'react'
import type { CreateUserInput } from '../application/ports'

interface OnboardingPageProps {
  error: string | null
  isCreating: boolean
  onCreate(input: CreateUserInput): void
}

export function OnboardingPage({ error, isCreating, onCreate }: OnboardingPageProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onCreate({ name: name.trim(), email: email.trim() })
  }

  return (
    <main className="onboarding page-frame">
      <section className="intro-panel">
        <p className="eyebrow">Your local workspace</p>
        <h1>Start with an identity.</h1>
        <p className="summary">
          TaskFlow has no authentication yet. Create a development user and this browser will
          remember its ID for future sessions.
        </p>
      </section>

      <form className="form-card" onSubmit={submit}>
        <div className="form-heading">
          <span className="step-number">01</span>
          <div>
            <h2>Create your user</h2>
            <p>This becomes the owner of your projects.</p>
          </div>
        </div>

        <label>
          Name
          <input
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={200}
            pattern=".*\S.*"
            autoComplete="name"
            required
          />
        </label>

        <label>
          Email
          <input
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            maxLength={320}
            autoComplete="email"
            required
          />
        </label>

        {error === null ? null : <p className="form-error">{error}</p>}

        <button className="primary-button" type="submit" disabled={isCreating}>
          {isCreating ? 'Creating...' : 'Create workspace'}
        </button>
      </form>
    </main>
  )
}
