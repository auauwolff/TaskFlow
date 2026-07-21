import { projectId, type ProjectId } from '@/features/projects/domain/project'
import { userId, type UserId } from '@/features/session/domain/user'
import { AppError } from '@/shared/errors/appError'
import type { GraphqlClient } from '@/shared/graphql/client'
import { graphql } from '@/shared/graphql/generated'
import type { TaskFieldsFragment, TaskPriority as GraphqlTaskPriority } from '@/shared/graphql/generated/graphql'
import type { CreateTaskInput, TasksGateway } from '../application/ports'
import { taskId, type Task, type TaskId, type TaskPriority } from '../domain/task'

// Documents are authored through the generated graphql() helper, so every operation is validated
// against the exported backend schema at generation time and carries its result/variable types
// into client.request() — a stale field name is a compile error, not a runtime surprise.
export const taskFieldsFragment = graphql(`
  fragment TaskFields on TaskItemDto {
    id
    projectId
    title
    description
    status
    priority
    assigneeId
    createdAt
    completedAt
  }
`)

const tasksDocument = graphql(`
  query Tasks($projectId: UUID!) {
    tasks(projectId: $projectId) {
      ...TaskFields
    }
  }
`)

const createTaskDocument = graphql(`
  mutation CreateTask($input: CreateTaskInput!) {
    task: createTask(input: $input) {
      ...TaskFields
    }
  }
`)

const completeTaskDocument = graphql(`
  mutation CompleteTask($id: UUID!) {
    task: completeTask(id: $id) {
      ...TaskFields
    }
  }
`)

const assignTaskDocument = graphql(`
  mutation AssignTask($id: UUID!, $input: AssignTaskInput!) {
    task: assignTask(id: $id, input: $input) {
      ...TaskFields
    }
  }
`)

export class GraphqlTasksGateway implements TasksGateway {
  private readonly client: GraphqlClient

  constructor(client: GraphqlClient) {
    this.client = client
  }

  async list(project: ProjectId, signal?: AbortSignal): Promise<Task[]> {
    const data = await this.client.request(tasksDocument, { projectId: project }, signal)

    return data.tasks.map(toTask)
  }

  async create(input: CreateTaskInput, signal?: AbortSignal): Promise<Task> {
    const data = await this.client.request(
      createTaskDocument,
      {
        input: {
          projectId: input.projectId,
          title: input.title,
          description: input.description,
          priority: toGraphqlPriority(input.priority),
        },
      },
      signal,
    )

    return toTask(data.task)
  }

  async complete(id: TaskId, signal?: AbortSignal): Promise<Task> {
    const data = await this.client.request(completeTaskDocument, { id }, signal)

    return toTask(data.task)
  }

  async assign(id: TaskId, assigneeId: UserId, signal?: AbortSignal): Promise<Task> {
    const data = await this.client.request(
      assignTaskDocument,
      { id, input: { assigneeId } },
      signal,
    )

    return toTask(data.task)
  }
}

function toGraphqlPriority(priority: TaskPriority): GraphqlTaskPriority {
  return priority.toUpperCase() as GraphqlTaskPriority
}

function toTask(value: TaskFieldsFragment): Task {
  return {
    id: taskId(value.id),
    projectId: projectId(value.projectId),
    title: value.title,
    description: value.description ?? null,
    status: toTaskStatus(value.status),
    priority: value.priority.toLowerCase() as TaskPriority,
    assigneeId: value.assigneeId == null ? null : userId(value.assigneeId),
    createdAt: toDate(value.createdAt, 'creation'),
    completedAt: value.completedAt == null ? null : toDate(value.completedAt, 'completion'),
  }
}

function toTaskStatus(value: TaskFieldsFragment['status']): Task['status'] {
  if (value === 'IN_PROGRESS') return 'in-progress'
  return value.toLowerCase() as Task['status']
}

function toDate(value: string, field: string): Date {
  const date = new Date(value)
  if (Number.isNaN(date.getTime()))
    throw new AppError(`The GraphQL API returned an invalid task ${field} date.`, 'unexpected')

  return date
}
