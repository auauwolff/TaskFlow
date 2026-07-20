import { antiforgeryClientToken, apiClientToken } from '@/shared/api/apiServices'
import { createServiceToken, type ServiceCollection } from '@/shared/ioc/core'
import { HttpAuthenticationGateway } from './adapters/httpAuthenticationGateway'
import type { AuthenticationGateway } from './application/ports'
import { SessionService } from './application/sessionService'
import { sessionServiceToken } from './presentation/sessionService'

const authenticationGatewayToken =
  createServiceToken<AuthenticationGateway>('AuthenticationGateway')

export function addSessionModule(services: ServiceCollection): void {
  services
    .singleton(authenticationGatewayToken, dependencies =>
      new HttpAuthenticationGateway(
        dependencies.get(apiClientToken),
        dependencies.get(antiforgeryClientToken),
      ))
    .singleton(sessionServiceToken, dependencies =>
      new SessionService(dependencies.get(authenticationGatewayToken)))
}
