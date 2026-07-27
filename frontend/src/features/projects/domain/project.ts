import type { ProjectId, UserId } from '@/shared/domain/identity'

export interface Project {
  id: ProjectId
  name: string
  description: string | null
  ownerId: UserId
  createdAt: Date
}
