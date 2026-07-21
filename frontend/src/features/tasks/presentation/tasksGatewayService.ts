import { createServiceToken } from '@/shared/ioc/core'
import { useService } from '@/shared/ioc/react'
import type { TasksGateway } from '../application/ports'

export const tasksGatewayToken = createServiceToken<TasksGateway>('TasksGateway')

export function useTasksGateway(): TasksGateway {
  return useService(tasksGatewayToken)
}
