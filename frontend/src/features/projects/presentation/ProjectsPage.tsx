import { useState, type FormEvent } from 'react'
import type { User } from '@/features/session/domain/user'
import { useProjectsPageModel } from './useProjectsPageModel'

interface ProjectsPageProps {
  user: User
  sessionError: string | null
  onSignOut(): void
}

export function ProjectsPage({ user, sessionError, onSignOut }: ProjectsPageProps) {
  const model = useProjectsPageModel(user.id)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (model.status !== 'ready') return

    const created = await model.create({
      name: name.trim(),
      description: description.trim() || null,
    })

    if (!created) return

    setName('')
    setDescription('')
  }

  return (
    <main className="workspace page-frame">
      <section className="workspace-heading">
        <div>
          <p className="eyebrow">{user.email}</p>
          <h1>{user.name}&apos;s projects</h1>
        </div>
        <button className="text-button" type="button" onClick={onSignOut}>
          Log out
        </button>
      </section>

      <div className="workspace-grid">
        <section className="project-section" aria-live="polite">
          {sessionError === null ? null : <p className="form-error">{sessionError}</p>}
          <div className="section-heading">
            <h2>Projects</h2>
            {model.status === 'ready' ? <span>{model.projects.length} total</span> : null}
          </div>

          {model.status === 'loading' ? <p className="muted-state">Loading projects...</p> : null}
          {model.status === 'error' ? (
            <div className="error-state">
              <p>{model.message}</p>
              <button className="text-button" type="button" onClick={model.retry}>
                Try again
              </button>
            </div>
          ) : null}
          {model.status === 'ready' && model.projects.length === 0 ? (
            <p className="muted-state">No projects yet. Make the first one.</p>
          ) : null}
          {model.status === 'ready' && model.projects.length > 0 ? (
            <ol className="project-list">
              {model.projects.map((project, index) => (
                <li key={project.id}>
                  <span className="project-index">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{project.name}</h3>
                    <p>{project.description ?? 'No description'}</p>
                  </div>
                  <time>{project.createdLabel}</time>
                </li>
              ))}
            </ol>
          ) : null}
        </section>

        <form className="form-card project-form" onSubmit={submit}>
          <div className="form-heading">
            <span className="step-number">+</span>
            <div>
              <h2>New project</h2>
              <p>Start small. Tasks come next.</p>
            </div>
          </div>

          <label>
            Project name
            <input
              name="projectName"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={200}
              required
            />
          </label>

          <label>
            Description <span className="optional">optional</span>
            <textarea
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={2000}
              rows={4}
            />
          </label>

          {model.status === 'ready' && model.createError !== null ? (
            <p className="form-error">{model.createError}</p>
          ) : null}

          <button
            className="primary-button"
            type="submit"
            disabled={model.status !== 'ready' || model.isCreating}
          >
            {model.status === 'ready' && model.isCreating ? 'Creating...' : 'Create project'}
          </button>
        </form>
      </div>
    </main>
  )
}
