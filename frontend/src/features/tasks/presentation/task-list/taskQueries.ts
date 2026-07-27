import { queryOptions } from '@tanstack/react-query'
import type { ProjectId } from '@/shared/domain/identity'
import { authenticatedQueryMeta } from '@/shared/query/authenticatedQueries'
import type { TasksGateway } from '../../application/ports'
import { taskKeys } from '../taskKeys'

export function tasksOptions(gateway: TasksGateway, projectId: ProjectId) {
  return queryOptions({
    queryKey: taskKeys.list(projectId),
    queryFn: ({ signal }) => gateway.list(projectId, signal),
    meta: authenticatedQueryMeta,
  })
}
