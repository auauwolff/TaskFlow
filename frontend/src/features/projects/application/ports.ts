import type { UserId } from '@/features/session/domain/user'
import type { Project } from '../domain/project'

export interface CreateProjectInput {
  name: string
  description: string | null
  ownerId: UserId
}

export interface ProjectsGateway {
  listByOwner(ownerId: UserId, signal?: AbortSignal): Promise<Project[]>
  create(input: CreateProjectInput, signal?: AbortSignal): Promise<Project>
}
