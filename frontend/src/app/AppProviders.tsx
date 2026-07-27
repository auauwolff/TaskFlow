import { QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { useEffect, type PropsWithChildren } from 'react'
import { transitionToAnonymousSession, useSession } from '@/features/session'
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
        <AuthenticatedCacheBoundary>{children}</AuthenticatedCacheBoundary>
      </QueryClientProvider>
    </ServiceProvider>
  )
}

function AuthenticatedCacheBoundary({ children }: PropsWithChildren) {
  const queryClient = useQueryClient()
  const antiforgery = useService(antiforgeryClientToken)
  const session = useSession()

  useEffect(() => {
    if (session.status !== 'anonymous') return

    transitionToAnonymousSession(queryClient)
    antiforgery.clear()
  }, [antiforgery, queryClient, session.status])

  return children
}
