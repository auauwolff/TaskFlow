import { useQuery } from '@tanstack/react-query'
import { errorMessage } from '@/shared/errors/appError'
import type { ProjectId } from '../domain/project'
import { projectsOptions } from './projectQueries'
import { useProjectsGateway } from './projectsGatewayContext'

export interface ProjectListItem {
  id: ProjectId
  name: string
  description: string | null
  createdLabel: string
}

export type ProjectsModel =
  | { status: 'loading' }
  | { status: 'error'; message: string; retry(): void }
  | { status: 'ready'; projects: ProjectListItem[] }

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
})

export function useProjects(): ProjectsModel {
  const gateway = useProjectsGateway()
  const projects = useQuery(projectsOptions(gateway))

  if (projects.isPending) return { status: 'loading' }

  if (projects.isError) {
    return {
      status: 'error',
      message: errorMessage(projects.error),
      retry: () => void projects.refetch(),
    }
  }

  return {
    status: 'ready',
    projects: projects.data.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      createdLabel: dateFormatter.format(project.createdAt),
    })),
  }
}
