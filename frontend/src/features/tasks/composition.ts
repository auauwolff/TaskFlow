import { antiforgeryClientToken, apiClientToken } from '@/shared/api/apiServices'
import type { ServiceCollection } from '@/shared/ioc/core'
import { HttpTasksGateway } from './adapters/httpTasksGateway'
import { tasksGatewayToken } from './presentation/tasksGatewayService'

export function addTasksModule(services: ServiceCollection): void {
  services.singleton(tasksGatewayToken, dependencies =>
    new HttpTasksGateway(
      dependencies.get(apiClientToken),
      dependencies.get(antiforgeryClientToken),
    ))
}
