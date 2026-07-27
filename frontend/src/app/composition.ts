import { QueryClient } from '@tanstack/react-query'
import { addProjectsModule } from '@/features/projects/composition'
import { addSessionModule } from '@/features/session/composition'
import { addTasksModule } from '@/features/tasks/composition'
import { transitionToAnonymousSession } from '@/features/session'
import { antiforgeryClientToken, apiClientToken } from '@/shared/api/apiServices'
import { createApiClient } from '@/shared/api/client'
import { HttpAntiforgeryClient } from '@/shared/api/antiforgery'
import { AppError } from '@/shared/errors/appError'
import { createGraphqlClient } from '@/shared/graphql/client'
import { graphqlClientToken } from '@/shared/graphql/graphqlServices'
import { ServiceCollection, type ServiceScopeResolver } from '@/shared/ioc/core'

export interface AppRuntime {
  queryClient: QueryClient
  services: ServiceScopeResolver
}

export function createAppRuntime(): AppRuntime {
  const queryClient = createQueryClient()

  // Typed REST transport (openapi-fetch over the generated OpenAPI schema). It takes no
  // antiforgery dependency because the antiforgery token itself is fetched through this
  // client — wiring it in here would be circular. Gateways attach the CSRF header
  // explicitly on their mutating calls instead.
  const apiClient = createApiClient(() => transitionToAnonymousSession(queryClient))

  // Fetches and memoizes the CSRF token (via the REST client above). Shared by every
  // transport and gateway that performs mutations, so the token is requested once.
  const antiforgery = new HttpAntiforgeryClient(apiClient)

  // GraphQL transport. Every GraphQL request is a POST, so the CSRF header is baked into
  // the transport itself rather than left to each caller.
  const graphqlClient = createGraphqlClient({
    endpoint: '/api/graphql',
    antiforgery,
    onUnauthorized: () => transitionToAnonymousSession(queryClient),
  })
  // Singleton because these hold app-wide state that must not be duplicated: the antiforgery
  // client memoizes one CSRF token, and both transports share one unauthorized-handling policy.
  // A second instance would mean a second token fetch and a second 401 pipeline. Anything
  // stateless or per-workspace belongs in a scope (see ServiceScopeProvider), not here.
  const registrations = new ServiceCollection()
    .singleton(apiClientToken, () => apiClient)
    .singleton(antiforgeryClientToken, () => antiforgery)
    .singleton(graphqlClientToken, () => graphqlClient)

  // Each feature registers its own services (gateways, application services) against the
  // shared collection. The composition root only knows *that* a feature participates, never
  // *what* it registers — features stay self-contained and can be added or removed in one line.
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
