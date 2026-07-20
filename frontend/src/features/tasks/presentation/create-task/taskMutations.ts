import { mutationOptions } from '@tanstack/react-query'
import type { CreateTaskInput, TasksGateway } from '../../application/ports'

export function createTaskOptions(gateway: TasksGateway) {
  return mutationOptions({
    mutationKey: ['tasks', 'create'] as const,
    mutationFn: (input: CreateTaskInput) => gateway.create(input),
  })
}
