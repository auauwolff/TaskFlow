import type { ProjectId } from '../domain/project'

export const projectKeys = {
  all: ['projects'] as const,
  list: () => [...projectKeys.all, 'list'] as const,
  detail: (id: ProjectId) => [...projectKeys.all, 'detail', id] as const,
}
