import { queryOptions } from '@tanstack/react-query'
import { authenticatedQueryMeta } from '@/shared/query/authenticatedQueries'
import type { ProjectsGateway } from '../../application/ports'
import type { ProjectId } from '@/shared/domain/identity'
import { projectKeys } from '../projectKeys'

export function projectOptions(
  gateway: ProjectsGateway,
  id: ProjectId,
) {
  return queryOptions({
    queryKey: projectKeys.detail(id),
    queryFn: ({ signal }) => gateway.get(id, signal),
    meta: authenticatedQueryMeta,
  })
}
