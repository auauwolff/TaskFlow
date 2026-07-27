import { Link } from '@tanstack/react-router'
import type { PropsWithChildren } from 'react'
import type { ProjectId } from '@/shared/domain/identity'
import { useProject } from './useProject'

interface ProjectDetailProps extends PropsWithChildren {
  projectId: ProjectId
}

export function ProjectDetail({ projectId, children }: ProjectDetailProps) {
  const project = useProject(projectId)

  if (project.status === 'loading')
    return <p className="muted-state">Loading project...</p>

  if (project.status === 'error')
    return (
      <section className="error-state">
        <p>{project.message}</p>
        <div className="inline-actions">
          <button className="text-button" type="button" onClick={project.retry}>
            Try again
          </button>
          <Link className="text-link" to="/">
            Back to projects
          </Link>
        </div>
      </section>
    )

  return (
    <>
      <section className="project-detail-heading">
        <Link className="text-link" to="/">
          Back to projects
        </Link>
        <p className="eyebrow">Project workspace</p>
        <h2>{project.project.name}</h2>
        <p>{project.project.description ?? 'No description'}</p>
      </section>
      {children}
    </>
  )
}
