import type { UserId } from '@/features/session/domain/user'

declare const projectIdBrand: unique symbol

const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type ProjectId = string & { readonly [projectIdBrand]: true }

export interface Project {
  id: ProjectId
  name: string
  description: string | null
  ownerId: UserId
  createdAt: Date
}

export function projectId(value: string): ProjectId {
  if (!guidPattern.test(value)) throw new Error('A valid project ID is required.')

  return value as ProjectId
}
