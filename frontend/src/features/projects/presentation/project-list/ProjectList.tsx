import { Link } from '@tanstack/react-router'
import { useProjects } from './useProjects'

export function ProjectList() {
  const projects = useProjects()

  return (
    <section className="project-section">
      <div className="section-heading">
        <h2>Projects</h2>
        {projects.status === 'ready' ? <span>{projects.projects.length} total</span> : null}
      </div>

      {/* Live region scoped to the status sentence only - see the note in TaskList.tsx. */}
      <div role="status">
        {projects.status === 'loading' ? <p className="muted-state">Loading projects...</p> : null}
        {projects.status === 'ready' && projects.projects.length === 0 ? (
          <p className="muted-state">No projects yet. Make the first one.</p>
        ) : null}
      </div>
      {projects.status === 'error' ? (
        <div className="error-state">
          <p>{projects.message}</p>
          <button className="text-button" type="button" onClick={projects.retry}>
            Try again
          </button>
        </div>
      ) : null}
      {projects.status === 'ready' && projects.projects.length > 0 ? (
        <ol className="project-list">
          {projects.projects.map((project, index) => (
            <li key={project.id}>
              <span className="project-index">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>
                  <Link to="/projects/$projectId" params={{ projectId: project.id }}>
                    {project.name}
                  </Link>
                </h3>
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
