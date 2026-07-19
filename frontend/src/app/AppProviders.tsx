import { QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { useEffect, type PropsWithChildren } from 'react'
import { ProjectsGatewayContext } from '@/features/projects/presentation/projectsGatewayContext'
import { transitionToAnonymousSession } from '@/features/session/presentation/current-session/sessionCache'
import { useSession } from '@/features/session/presentation/current-session/useSession'
import { SessionServiceContext } from '@/features/session/presentation/sessionContext'
import type { AppRuntime } from './composition'

interface AppProvidersProps extends PropsWithChildren {
  runtime: AppRuntime
}

export function AppProviders({ runtime, children }: AppProvidersProps) {
  return (
    <ProjectsGatewayContext value={runtime.projects}>
      <QueryClientProvider client={runtime.queryClient}>
        <SessionServiceContext value={runtime.session}>
          <AuthenticatedCacheBoundary>{children}</AuthenticatedCacheBoundary>
        </SessionServiceContext>
      </QueryClientProvider>
    </ProjectsGatewayContext>
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
