import { graphqlClientToken } from '@/shared/graphql/graphqlServices'
import type { ServiceCollection } from '@/shared/ioc/core'
import { GraphqlTasksGateway } from './adapters/graphqlTasksGateway'
import { TasksWorkspaceViewStore } from './presentation/tasksWorkspaceViewStore'
import { tasksGatewayToken } from './presentation/tasksGatewayService'
import { tasksWorkspaceViewStoreToken } from './presentation/tasksWorkspaceViewStoreService'

export function addTasksModule(services: ServiceCollection): void {
  services.singleton(tasksGatewayToken, (dependencies) =>
    new GraphqlTasksGateway(dependencies.get(graphqlClientToken)))
}

export function addTasksWorkspaceScope(services: ServiceCollection): void {
  services.scoped(tasksWorkspaceViewStoreToken, () => new TasksWorkspaceViewStore())
}
