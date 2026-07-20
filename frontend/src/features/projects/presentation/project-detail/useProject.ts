import { useQuery } from '@tanstack/react-query'
import { errorMessage } from '@/shared/errors/appError'
import type { Project } from '../../domain/project'
import { useProjectsGateway } from '../projectsGatewayService'
import { projectOptions } from './projectQueries'
import { useProjectWorkspace } from './projectWorkspaceService'

export type ProjectModel =
  | { status: 'loading' }
  | { status: 'error'; message: string; retry(): void }
  | { status: 'ready'; project: Project }

export function useProject(id: Project['id']): ProjectModel {
  const gateway = useProjectsGateway()
  const workspace = useProjectWorkspace()
  const project = useQuery(projectOptions(gateway, id, workspace.signal))

  if (project.isPending) return { status: 'loading' }
  if (project.isError)
    return {
      status: 'error',
      message: errorMessage(project.error),
      retry: () => void project.refetch(),
    }

  return { status: 'ready', project: project.data }
}
