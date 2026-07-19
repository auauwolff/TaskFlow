import { QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { useEffect, type PropsWithChildren } from 'react'
import { ProjectsGatewayContext } from '@/features/projects/presentation/projectsGatewayContext'
import { SessionActorContext } from '@/features/session/presentation/sessionContext'
import type { AppRuntime } from './composition'

interface AppProvidersProps extends PropsWithChildren {
  runtime: AppRuntime
}

export function AppProviders({ runtime, children }: AppProvidersProps) {
  return (
    <ProjectsGatewayContext value={runtime.projects}>
      <QueryClientProvider client={runtime.queryClient}>
        <SessionActorContext.Provider logic={runtime.sessionLogic}>
          <AuthenticatedCacheBoundary>{children}</AuthenticatedCacheBoundary>
        </SessionActorContext.Provider>
      </QueryClientProvider>
    </ProjectsGatewayContext>
  )
}

function AuthenticatedCacheBoundary({ children }: PropsWithChildren) {
  const queryClient = useQueryClient()
  const isAnonymous = SessionActorContext.useSelector((snapshot) =>
    snapshot.matches('anonymous'),
  )

  useEffect(() => {
    if (isAnonymous) queryClient.clear()
  }, [isAnonymous, queryClient])

  return children
}
