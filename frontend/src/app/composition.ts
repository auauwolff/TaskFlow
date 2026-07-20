import { QueryClient } from '@tanstack/react-query'
import { addProjectsModule } from '@/features/projects/composition'
import { addSessionModule } from '@/features/session/composition'
import { transitionToAnonymousSession } from '@/features/session/presentation/current-session/sessionCache'
import { addTasksModule } from '@/features/tasks/composition'
import { antiforgeryClientToken, apiClientToken } from '@/shared/api/apiServices'
import { createApiClient } from '@/shared/api/client'
import { HttpAntiforgeryClient } from '@/shared/api/antiforgery'
import { AppError } from '@/shared/errors/appError'
import { ServiceCollection, type ServiceScopeResolver } from '@/shared/ioc/core'

export interface AppRuntime {
  queryClient: QueryClient
  services: ServiceScopeResolver
}

export function createAppRuntime(): AppRuntime {
  const queryClient = createQueryClient()
  const registrations = new ServiceCollection()
    .singleton(apiClientToken, () =>
      createApiClient(() => transitionToAnonymousSession(queryClient)))
    .singleton(antiforgeryClientToken, dependencies =>
      new HttpAntiforgeryClient(dependencies.get(apiClientToken)))

  addSessionModule(registrations)
  addProjectsModule(registrations)
  addTasksModule(registrations)

  const services = registrations.build()

  return {
    queryClient,
    services,
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
