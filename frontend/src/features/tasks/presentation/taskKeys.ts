import type { ProjectId } from '@/features/projects/domain/project'

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (projectId: ProjectId) => [...taskKeys.lists(), projectId] as const,
}
