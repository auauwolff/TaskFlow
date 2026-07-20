import { antiforgeryClientToken, apiClientToken } from '@/shared/api/apiServices'
import type { ServiceCollection } from '@/shared/ioc/core'
import { HttpProjectsGateway } from './adapters/httpProjectsGateway'
import { projectsGatewayToken } from './presentation/projectsGatewayService'

export function addProjectsModule(services: ServiceCollection): void {
  services.singleton(projectsGatewayToken, dependencies =>
    new HttpProjectsGateway(
      dependencies.get(apiClientToken),
      dependencies.get(antiforgeryClientToken),
    ))
}
