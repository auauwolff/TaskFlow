import { queryOptions } from '@tanstack/react-query'
import { authenticatedQueryMeta } from '@/shared/query/authenticatedQueries'
import type { ProjectsGateway } from '../../application/ports'
import { projectKeys } from '../projectKeys'

export function projectsOptions(gateway: ProjectsGateway) {
  return queryOptions({
    queryKey: projectKeys.list(),
    queryFn: ({ signal }) => gateway.list(signal),
    meta: authenticatedQueryMeta,
  })
}
