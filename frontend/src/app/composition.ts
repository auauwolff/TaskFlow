import { QueryClient } from '@tanstack/react-query'
import type { ProjectsGateway } from '@/features/projects/application/ports'
import { createHttpProjectsGateway } from '@/features/projects/adapters/httpProjectsGateway'
import { createHttpUsersGateway } from '@/features/session/adapters/httpUsersGateway'
import { createLocalCurrentUserStorage } from '@/features/session/adapters/localCurrentUserStorage'
import { createSessionService } from '@/features/session/application/sessionService'
import { provideSessionMachine } from '@/features/session/presentation/sessionMachine'
import { createApiClient } from '@/shared/api/client'
import { AppError } from '@/shared/errors/appError'

export interface Application {
  queryClient: QueryClient
  projects: ProjectsGateway
  sessionLogic: ReturnType<typeof provideSessionMachine>
}

export function createApplication(storage: Storage): Application {
  const apiClient = createApiClient()
  const users = createHttpUsersGateway(apiClient)
  const projects = createHttpProjectsGateway(apiClient)
  const currentUserStorage = createLocalCurrentUserStorage(storage)
  const session = createSessionService(users, currentUserStorage)

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
