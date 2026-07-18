import { createContext, use } from 'react'
import type { ProjectsGateway } from '../application/ports'

export const ProjectsGatewayContext = createContext<ProjectsGateway | null>(null)

export function useProjectsGateway(): ProjectsGateway {
  const gateway = use(ProjectsGatewayContext)

  if (gateway === null)
    throw new Error('ProjectsGateway must be provided at the composition root.')

  return gateway
}
