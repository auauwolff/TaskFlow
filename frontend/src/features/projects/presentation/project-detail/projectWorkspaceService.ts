import { createServiceToken } from '@/shared/ioc/core'
import { useService } from '@/shared/ioc/react'
import type { ProjectWorkspace } from '../../application/projectWorkspace'

export const projectWorkspaceToken = createServiceToken<ProjectWorkspace>('ProjectWorkspace')

export function useProjectWorkspace(): ProjectWorkspace {
  return useService(projectWorkspaceToken)
}
