import { queryOptions } from '@tanstack/react-query'
import { authenticatedQueryMeta } from '@/shared/query/authenticatedQueries'
import type { ProjectsGateway } from '../../application/ports'
import type { ProjectId } from '../../domain/project'
import { projectKeys } from '../projectKeys'

export function projectOptions(
  gateway: ProjectsGateway,
  id: ProjectId,
  workspaceSignal?: AbortSignal,
) {
  return queryOptions({
    queryKey: projectKeys.detail(id),
    // Abort when Query cancels the fetch or when the project workspace is torn down, whichever
    // comes first. The workspace signal makes leaving the project cancel an in-flight load.
    queryFn: ({ signal }) =>
      gateway.get(id, workspaceSignal ? AbortSignal.any([signal, workspaceSignal]) : signal),
    meta: authenticatedQueryMeta,
  })
}
