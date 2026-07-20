import { mutationOptions } from '@tanstack/react-query'
import type { TasksGateway } from '../../application/ports'
import type { TaskId } from '../../domain/task'

export function completeTaskOptions(gateway: TasksGateway) {
  return mutationOptions({
    mutationKey: ['tasks', 'complete'] as const,
    mutationFn: (id: TaskId) => gateway.complete(id),
  })
}
