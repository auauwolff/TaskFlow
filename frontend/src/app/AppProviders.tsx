import { QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { useEffect, type PropsWithChildren } from 'react'
import { ProjectsGatewayContext } from '@/features/projects/presentation/projectsGatewayContext'
import { SessionActorContext } from '@/features/session/presentation/sessionContext'
import type { Application } from './composition'

interface AppProvidersProps extends PropsWithChildren {
  application: Application
}

export function AppProviders({ application, children }: AppProvidersProps) {
  return (
    <ProjectsGatewayContext value={application.projects}>
      <QueryClientProvider client={application.queryClient}>
        <SessionActorContext.Provider logic={application.sessionLogic}>
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
