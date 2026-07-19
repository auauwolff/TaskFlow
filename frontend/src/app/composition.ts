import { QueryClient } from '@tanstack/react-query'
import type { ProjectsGateway } from '@/features/projects/application/ports'
import { createHttpProjectsGateway } from '@/features/projects/adapters/httpProjectsGateway'
import { createHttpAuthenticationGateway } from '@/features/session/adapters/httpAuthenticationGateway'
import { createSessionService } from '@/features/session/application/sessionService'
import { provideSessionMachine } from '@/features/session/presentation/sessionMachine'
import { createApiClient } from '@/shared/api/client'
import { createAntiforgeryClient } from '@/shared/api/antiforgery'
import { AppError } from '@/shared/errors/appError'

export interface Application {
  queryClient: QueryClient
  projects: ProjectsGateway
  sessionLogic: ReturnType<typeof provideSessionMachine>
}

export function createApplication(): Application {
  const apiClient = createApiClient()
  const antiforgery = createAntiforgeryClient(apiClient)
  const authentication = createHttpAuthenticationGateway(apiClient, antiforgery)
  const projects = createHttpProjectsGateway(apiClient, antiforgery)
  const session = createSessionService(authentication)

  return {
    queryClient: new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          retry: (attempt, error) =>
            error instanceof AppError && error.kind === 'network' && attempt < 2,
        },
      },
    }),
    projects,
    sessionLogic: provideSessionMachine(session),
  }
}
