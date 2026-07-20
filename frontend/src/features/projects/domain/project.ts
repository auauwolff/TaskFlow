import { guidIdentifier } from '@/shared/domain/identifier'
import type { UserId } from '@/features/session/domain/user'

declare const projectIdBrand: unique symbol

export type ProjectId = string & { readonly [projectIdBrand]: true }

export interface Project {
  id: ProjectId
  name: string
  description: string | null
  ownerId: UserId
  createdAt: Date
}

export const projectId = guidIdentifier<ProjectId>('project ID')
