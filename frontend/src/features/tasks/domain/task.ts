import { guidIdentifier } from '@/shared/domain/identifier'
import type { ProjectId } from '@/shared/domain/identity'
import type { UserId } from '@/shared/domain/identity'

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

export const taskId = guidIdentifier<TaskId>('task ID')
