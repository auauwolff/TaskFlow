import { queryOptions } from '@tanstack/react-query'
import { authenticatedQueryMeta } from '@/shared/query/authenticatedQueries'
import type { ProjectsGateway } from '../application/ports'

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
