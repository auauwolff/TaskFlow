import { projectId, type ProjectId } from '@/features/projects/domain/project'
import { userId, type UserId } from '@/features/session/domain/user'
import { apiError, networkError } from '@/shared/api/apiError'
import type { AntiforgeryClient } from '@/shared/api/antiforgery'
import type { ApiClient } from '@/shared/api/client'
import type { components } from '@/shared/api/schema'
import { AppError } from '@/shared/errors/appError'
import type { CreateTaskInput, TasksGateway } from '../application/ports'
import {
  taskId,
  type Task,
  type TaskId,
  type TaskPriority,
  type TaskStatus,
} from '../domain/task'

type TaskDto = components['schemas']['TaskItemDto']
type WireTaskPriority = components['schemas']['TaskPriority']

const priorityToWire: Record<TaskPriority, WireTaskPriority> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export class HttpTasksGateway implements TasksGateway {
  private readonly client: ApiClient
  private readonly antiforgery: AntiforgeryClient

  constructor(client: ApiClient, antiforgery: AntiforgeryClient) {
    this.client = client
    this.antiforgery = antiforgery
  }

  async list(project: ProjectId, signal?: AbortSignal): Promise<Task[]> {
    try {
      const { data, error, response } = await this.client.GET('/api/tasks', {
        params: { query: { projectId: project } },
        signal,
      })

      if (data !== undefined) return data.map(toTask)
      throw apiError(response, error)
    } catch (error) {
      throw networkError(error)
    }
  }

  async create(input: CreateTaskInput, signal?: AbortSignal): Promise<Task> {
    return this.write(
      async () =>
        this.client.POST('/api/tasks', {
          body: {
            projectId: input.projectId,
            title: input.title,
            description: input.description,
            priority: priorityToWire[input.priority],
          },
          headers: await this.antiforgery.header(signal),
          signal,
        }),
    )
  }

  async complete(id: TaskId, signal?: AbortSignal): Promise<Task> {
    return this.write(async () =>
      this.client.PATCH('/api/tasks/{id}/complete', {
        params: { path: { id } },
        headers: await this.antiforgery.header(signal),
        signal,
      }),
    )
  }

  async assign(id: TaskId, assignee: UserId, signal?: AbortSignal): Promise<Task> {
    return this.write(async () =>
      this.client.PATCH('/api/tasks/{id}/assignee', {
        params: { path: { id } },
        body: { assigneeId: assignee },
        headers: await this.antiforgery.header(signal),
        signal,
      }),
    )
  }

  private async write(
    request: () => ReturnType<ApiClient['POST']> | ReturnType<ApiClient['PATCH']>,
  ): Promise<Task> {
    try {
      const { data, error, response } = await request()

      if (data !== undefined) return toTask(data as TaskDto)
      this.antiforgery.clear()
      throw apiError(response, error)
    } catch (error) {
      throw networkError(error)
    }
  }
}

function toTask(dto: TaskDto): Task {
  const createdAt = toDate(dto.createdAt, 'creation')
  const completedAt = dto.completedAt === null ? null : toDate(dto.completedAt, 'completion')

  return {
    id: taskId(dto.id),
    projectId: projectId(dto.projectId),
    title: dto.title,
    description: dto.description,
    status: toStatus(dto.status),
    priority: toPriority(dto.priority),
    assigneeId: dto.assigneeId === null ? null : userId(dto.assigneeId),
    createdAt,
    completedAt,
  }
}

function toDate(value: string, name: string): Date {
  const date = new Date(value)
  if (Number.isNaN(date.getTime()))
    throw new AppError(`The API returned an invalid task ${name} date.`, 'unexpected')
  return date
}

function toStatus(value: unknown): TaskStatus {
  if (value === 'Todo') return 'todo'
  if (value === 'InProgress') return 'in-progress'
  if (value === 'Done') return 'done'
  throw new AppError('The API returned an invalid task status.', 'unexpected')
}

function toPriority(value: unknown): TaskPriority {
  if (value === 'Low') return 'low'
  if (value === 'Medium') return 'medium'
  if (value === 'High') return 'high'
  throw new AppError('The API returned an invalid task priority.', 'unexpected')
}
