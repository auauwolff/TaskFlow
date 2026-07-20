import { antiforgeryClientToken, apiClientToken } from '@/shared/api/apiServices'
import type { ServiceCollection } from '@/shared/ioc/core'
import { HttpProjectsGateway } from './adapters/httpProjectsGateway'
import { ProjectWorkspaceScope } from './application/projectWorkspace'
import { projectsGatewayToken } from './presentation/projectsGatewayService'
import { projectWorkspaceToken } from './presentation/project-detail/projectWorkspaceService'

export function addProjectsModule(services: ServiceCollection): void {
  services.singleton(projectsGatewayToken, dependencies =>
    new HttpProjectsGateway(
      dependencies.get(apiClientToken),
      dependencies.get(antiforgeryClientToken),
    ))
}

/**
 * Registers the per-project workspace as a scoped service. It is applied by the project route
 * through `ServiceScopeProvider`, so each open project gets its own instance whose lifetime — and
 * disposal — is tied to that subtree being mounted.
 */
export function addProjectWorkspaceScope(services: ServiceCollection): void {
  services.scoped(projectWorkspaceToken, () => new ProjectWorkspaceScope())
}
