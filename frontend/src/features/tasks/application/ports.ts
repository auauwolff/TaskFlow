import type { ProjectId } from '@/shared/domain/identity'
import type { UserId } from '@/shared/domain/identity'
import type { Task, TaskId, TaskPriority } from '../domain/task'

export interface CreateTaskInput {
  projectId: ProjectId
  title: string
  description: string | null
  priority: TaskPriority
}

export interface TasksGateway {
  list(projectId: ProjectId, signal?: AbortSignal): Promise<Task[]>
  create(input: CreateTaskInput, signal?: AbortSignal): Promise<Task>
  complete(id: TaskId, signal?: AbortSignal): Promise<Task>
  assign(id: TaskId, assigneeId: UserId, signal?: AbortSignal): Promise<Task>
}
