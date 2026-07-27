import type { ProjectId } from '@/shared/domain/identity'

export const projectKeys = {
  all: ['projects'] as const,
  list: () => [...projectKeys.all, 'list'] as const,
  detail: (id: ProjectId) => [...projectKeys.all, 'detail', id] as const,
}
