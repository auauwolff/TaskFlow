import { mutationOptions, queryOptions } from '@tanstack/react-query'
import { authenticatedQueryMeta } from '@/shared/query/authenticatedQueries'
import type { CreateProjectInput, ProjectsGateway } from '../application/ports'

export const projectKeys = {
  all: ['projects'] as const,
  list: () => [...projectKeys.all, 'list'] as const,
}

export function projectsOptions(gateway: ProjectsGateway) {
  return queryOptions({
    queryKey: projectKeys.list(),
    queryFn: ({ signal }) => gateway.list(signal),
    meta: authenticatedQueryMeta,
  })
}

export function createProjectOptions(gateway: ProjectsGateway) {
  return mutationOptions({
    mutationKey: [...projectKeys.all, 'create'] as const,
    mutationFn: (input: CreateProjectInput) => gateway.create(input),
  })
}
