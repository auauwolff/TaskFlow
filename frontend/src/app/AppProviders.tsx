import { ApolloProvider, useApolloClient } from '@apollo/client/react'
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { useEffect, type PropsWithChildren } from 'react'
import { transitionToAnonymousSession } from '@/features/session/presentation/current-session/sessionCache'
import { useSession } from '@/features/session/presentation/current-session/useSession'
import { antiforgeryClientToken } from '@/shared/api/apiServices'
import { ServiceProvider, useService } from '@/shared/ioc/react'
import type { AppRuntime } from './composition'

interface AppProvidersProps extends PropsWithChildren {
  runtime: AppRuntime
}

export function AppProviders({ runtime, children }: AppProvidersProps) {
  return (
    <ServiceProvider services={runtime.services}>
      <QueryClientProvider client={runtime.queryClient}>
        <ApolloProvider client={runtime.apolloClient}>
          <AuthenticatedCacheBoundary>{children}</AuthenticatedCacheBoundary>
        </ApolloProvider>
      </QueryClientProvider>
    </ServiceProvider>
  )
}

function AuthenticatedCacheBoundary({ children }: PropsWithChildren) {
  const queryClient = useQueryClient()
  const apolloClient = useApolloClient()
  const antiforgery = useService(antiforgeryClientToken)
  const session = useSession()

  useEffect(() => {
    if (session.status !== 'anonymous') return

    transitionToAnonymousSession(queryClient)
    antiforgery.clear()
    void apolloClient.clearStore()
  }, [antiforgery, apolloClient, queryClient, session.status])

  return children
}
