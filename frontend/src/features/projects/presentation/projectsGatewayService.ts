import { createServiceToken } from '@/shared/ioc/core'
import { useService } from '@/shared/ioc/react'
import type { ProjectsGateway } from '../application/ports'

export const projectsGatewayToken = createServiceToken<ProjectsGateway>('ProjectsGateway')

export function useProjectsGateway(): ProjectsGateway {
  return useService(projectsGatewayToken)
}
