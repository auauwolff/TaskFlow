import { mutationOptions } from '@tanstack/react-query'
import type { UserId } from '@/features/session/domain/user'
import type { TasksGateway } from '../../application/ports'
import type { TaskId } from '../../domain/task'

export interface AssignTaskVariables {
  id: TaskId
  assigneeId: UserId
}

export function assignTaskOptions(gateway: TasksGateway) {
  return mutationOptions({
    mutationKey: ['tasks', 'assign'] as const,
    mutationFn: ({ id, assigneeId }: AssignTaskVariables) => gateway.assign(id, assigneeId),
  })
}
