import { useProjects } from './useProjects'

export function ProjectList() {
  const projects = useProjects()

  return (
    <section className="project-section" aria-live="polite">
      <div className="section-heading">
        <h2>Projects</h2>
        {projects.status === 'ready' ? <span>{projects.projects.length} total</span> : null}
      </div>

      {projects.status === 'loading' ? <p className="muted-state">Loading projects...</p> : null}
      {projects.status === 'error' ? (
        <div className="error-state">
          <p>{projects.message}</p>
          <button className="text-button" type="button" onClick={projects.retry}>
            Try again
          </button>
        </div>
      ) : null}
      {projects.status === 'ready' && projects.projects.length === 0 ? (
        <p className="muted-state">No projects yet. Make the first one.</p>
      ) : null}
      {projects.status === 'ready' && projects.projects.length > 0 ? (
        <ol className="project-list">
          {projects.projects.map((project, index) => (
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
  )
}
