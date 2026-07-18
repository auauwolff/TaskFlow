import { QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
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
          {children}
        </SessionActorContext.Provider>
      </QueryClientProvider>
    </ProjectsGatewayContext>
  )
}
