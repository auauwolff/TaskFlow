import type { ProjectId } from '@/features/projects/domain/project'
import type { UserId } from '@/features/session/domain/user'

declare const taskIdBrand: unique symbol

export type TaskId = string & { readonly [taskIdBrand]: true }
export type TaskStatus = 'todo' | 'in-progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: TaskId
  projectId: ProjectId
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  assigneeId: UserId | null
  createdAt: Date
  completedAt: Date | null
}

export function taskId(value: string): TaskId {
  return value as TaskId
}
