import { projectId, type ProjectId } from '@/features/projects/domain/project'
import { userId, type UserId } from '@/features/session/domain/user'
import { AppError } from '@/shared/errors/appError'
import type { GraphqlClient } from '@/shared/graphql/client'
import type { CreateTaskInput, TasksGateway } from '../application/ports'
import { taskId, type Task, type TaskId, type TaskPriority } from '../domain/task'

interface TaskFields {
  __typename: 'TaskItemDto'
  id: string
  projectId: string
  title: string
  description: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  assigneeId: string | null
  createdAt: string
  completedAt: string | null
}

const TASK_FIELDS = `
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
`

const TASKS_DOCUMENT = `
  query Tasks($projectId: UUID!) {
    tasks(projectId: $projectId) {
      ...TaskFields
    }
  }
  ${TASK_FIELDS}
`

const CREATE_TASK_DOCUMENT = `
  mutation CreateTask($input: CreateTaskInput!) {
    task: createTask(input: $input) {
      ...TaskFields
    }
  }
  ${TASK_FIELDS}
`

const COMPLETE_TASK_DOCUMENT = `
  mutation CompleteTask($id: UUID!) {
    task: completeTask(id: $id) {
      ...TaskFields
    }
  }
  ${TASK_FIELDS}
`

const ASSIGN_TASK_DOCUMENT = `
  mutation AssignTask($id: UUID!, $input: AssignTaskInput!) {
    task: assignTask(id: $id, input: $input) {
      ...TaskFields
    }
  }
  ${TASK_FIELDS}
`

export class GraphqlTasksGateway implements TasksGateway {
  private readonly client: GraphqlClient

  constructor(client: GraphqlClient) {
    this.client = client
  }

  async list(project: ProjectId, signal?: AbortSignal): Promise<Task[]> {
    const data = await this.client.request<{ tasks: TaskFields[] }>(
      TASKS_DOCUMENT,
      { projectId: project },
      signal,
    )

    return data.tasks.map(toTask)
  }

  async create(input: CreateTaskInput, signal?: AbortSignal): Promise<Task> {
    const data = await this.client.request<{ task: TaskFields }>(
      CREATE_TASK_DOCUMENT,
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
    const data = await this.client.request<{ task: TaskFields }>(
      COMPLETE_TASK_DOCUMENT,
      { id },
      signal,
    )

    return toTask(data.task)
  }

  async assign(id: TaskId, assigneeId: UserId, signal?: AbortSignal): Promise<Task> {
    const data = await this.client.request<{ task: TaskFields }>(
      ASSIGN_TASK_DOCUMENT,
      { id, input: { assigneeId } },
      signal,
    )

    return toTask(data.task)
  }
}

function toGraphqlPriority(priority: TaskPriority): TaskFields['priority'] {
  return priority.toUpperCase() as TaskFields['priority']
}

function toTask(value: TaskFields): Task {
  return {
    id: taskId(value.id),
    projectId: projectId(value.projectId),
    title: value.title,
    description: value.description,
    status: toTaskStatus(value.status),
    priority: value.priority.toLowerCase() as TaskPriority,
    assigneeId: value.assigneeId === null ? null : userId(value.assigneeId),
    createdAt: toDate(value.createdAt, 'creation'),
    completedAt: value.completedAt === null ? null : toDate(value.completedAt, 'completion'),
  }
}

function toTaskStatus(value: TaskFields['status']): Task['status'] {
  if (value === 'IN_PROGRESS') return 'in-progress'
  return value.toLowerCase() as Task['status']
}

function toDate(value: string, field: string): Date {
  const date = new Date(value)
  if (Number.isNaN(date.getTime()))
    throw new AppError(`The GraphQL API returned an invalid task ${field} date.`, 'unexpected')

  return date
}
