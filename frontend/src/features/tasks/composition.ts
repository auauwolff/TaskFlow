import type { ServiceCollection } from '@/shared/ioc/core'
import { TasksWorkspaceViewStore } from './presentation/tasksWorkspaceViewStore'
import { tasksWorkspaceViewStoreToken } from './presentation/tasksWorkspaceViewStoreService'

export function addTasksWorkspaceScope(services: ServiceCollection): void {
  services.scoped(tasksWorkspaceViewStoreToken, () => new TasksWorkspaceViewStore())
}
