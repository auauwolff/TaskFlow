import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UserId } from '@/features/session/domain/user'
import { errorMessage } from '@/shared/errors/appError'
import type { ProjectId } from '../domain/project'
import {
  createProjectOptions,
  projectKeys,
  projectsByOwnerOptions,
} from './projectQueries'
import { useProjectsGateway } from './projectsGatewayContext'

export interface CreateProjectDraft {
  name: string
  description: string | null
}

export interface ProjectListItem {
  id: ProjectId
  name: string
  description: string | null
  createdLabel: string
}

export type ProjectsPageModel =
  | { status: 'loading' }
  | { status: 'error'; message: string; retry(): void }
  | {
      status: 'ready'
      projects: ProjectListItem[]
      isCreating: boolean
      createError: string | null
      create(input: CreateProjectDraft): Promise<boolean>
    }

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
})

export function useProjectsPageModel(ownerId: UserId): ProjectsPageModel {
  const gateway = useProjectsGateway()
  const queryClient = useQueryClient()
  const projectsQuery = useQuery(projectsByOwnerOptions(gateway, ownerId))
  const createProject = useMutation({
    ...createProjectOptions(gateway),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectKeys.byOwner(ownerId) })
    },
  })

  if (projectsQuery.isPending) return { status: 'loading' }

  if (projectsQuery.isError) {
    return {
      status: 'error',
      message: errorMessage(projectsQuery.error),
      retry: () => void projectsQuery.refetch(),
    }
  }

  return {
    status: 'ready',
    projects: projectsQuery.data.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      createdLabel: dateFormatter.format(project.createdAt),
    })),
    isCreating: createProject.isPending,
    createError: createProject.error === null ? null : errorMessage(createProject.error),
    create: async (input) => {
      try {
        await createProject.mutateAsync({ ...input, ownerId })
        return true
      } catch {
        return false
      }
    },
  }
}
