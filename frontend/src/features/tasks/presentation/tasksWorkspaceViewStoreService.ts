import { createServiceToken } from '@/shared/ioc/core'
import { useService } from '@/shared/ioc/react'
import type { TasksWorkspaceViewStore } from './tasksWorkspaceViewStore'

export const tasksWorkspaceViewStoreToken = createServiceToken<TasksWorkspaceViewStore>(
  'tasks.workspaceViewStore',
)

export function useTasksWorkspaceViewStore(): TasksWorkspaceViewStore {
  return useService(tasksWorkspaceViewStoreToken)
}
