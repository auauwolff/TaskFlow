import { QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { useEffect, type PropsWithChildren } from 'react'
import { transitionToAnonymousSession } from '@/features/session/presentation/current-session/sessionCache'
import { useSession } from '@/features/session/presentation/current-session/useSession'
import { ServiceProvider } from '@/shared/ioc/react'
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
  const session = useSession()

  useEffect(() => {
    if (session.status !== 'anonymous') return

    transitionToAnonymousSession(queryClient)
  }, [queryClient, session.status])

  return children
}
