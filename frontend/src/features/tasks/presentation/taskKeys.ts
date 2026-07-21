import type { ProjectId } from '@/features/projects/domain/project'

export const taskKeys = {
  all: ['tasks'] as const,
  list: (projectId: ProjectId) => [...taskKeys.all, 'list', projectId] as const,
}
