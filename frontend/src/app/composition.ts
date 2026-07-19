import { QueryClient } from '@tanstack/react-query'
import type { ProjectsGateway } from '@/features/projects/application/ports'
import { HttpProjectsGateway } from '@/features/projects/adapters/httpProjectsGateway'
import { HttpAuthenticationGateway } from '@/features/session/adapters/httpAuthenticationGateway'
import { SessionService, type SessionUseCases } from '@/features/session/application/sessionService'
import { createApiClient } from '@/shared/api/client'
import { HttpAntiforgeryClient } from '@/shared/api/antiforgery'
import { AppError } from '@/shared/errors/appError'

export interface AppRuntime {
  queryClient: QueryClient
  projects: ProjectsGateway
  session: SessionUseCases
}

export function createAppRuntime(): AppRuntime {
  const apiClient = createApiClient()
  const antiforgery = new HttpAntiforgeryClient(apiClient)
  const authentication = new HttpAuthenticationGateway(apiClient, antiforgery)
  const projects = new HttpProjectsGateway(apiClient, antiforgery)
  const session = new SessionService(authentication)

  return {
    queryClient: createQueryClient(),
    projects,
    session,
  }
}

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (attempt, error) =>
          error instanceof AppError && error.kind === 'network' && attempt < 2,
      },
    },
  })
}
