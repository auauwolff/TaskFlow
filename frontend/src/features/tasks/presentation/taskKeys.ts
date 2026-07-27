import type { ProjectId } from '@/shared/domain/identity'

export const taskKeys = {
  all: ['tasks'] as const,
  list: (projectId: ProjectId) => [...taskKeys.all, 'list', projectId] as const,

  // Mutation keys, so per-task in-flight state can be read back out of the MutationCache by
  // `useMutationState`. Scoped by project for the same reason the list key is: two workspaces
  // open in two tabs must not observe each other's pending mutations.
  complete: (projectId: ProjectId) => [...taskKeys.all, 'complete', projectId] as const,
  assign: (projectId: ProjectId) => [...taskKeys.all, 'assign', projectId] as const,
}
