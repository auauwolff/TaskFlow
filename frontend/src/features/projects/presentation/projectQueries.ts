import { mutationOptions, queryOptions } from '@tanstack/react-query'
import type { UserId } from '@/features/session/domain/user'
import type { CreateProjectInput, ProjectsGateway } from '../application/ports'

export const projectKeys = {
  all: ['projects'] as const,
  byOwner: (ownerId: UserId) => [...projectKeys.all, 'owner', ownerId] as const,
}

export function projectsByOwnerOptions(gateway: ProjectsGateway, ownerId: UserId) {
  return queryOptions({
    queryKey: projectKeys.byOwner(ownerId),
    queryFn: ({ signal }) => gateway.listByOwner(ownerId, signal),
  })
}

export function createProjectOptions(gateway: ProjectsGateway) {
  return mutationOptions({
    mutationKey: [...projectKeys.all, 'create'] as const,
    mutationFn: (input: CreateProjectInput) => gateway.create(input),
  })
}
