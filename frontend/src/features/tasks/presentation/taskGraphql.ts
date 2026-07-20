import { gql, type TypedDocumentNode } from '@apollo/client'
import { projectId } from '@/features/projects/domain/project'
import { userId } from '@/features/session/domain/user'
import { AppError } from '@/shared/errors/appError'
import { taskId, type Task, type TaskPriority } from '../domain/task'

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

interface TasksData {
  tasks: TaskFields[]
}

interface TasksVariables {
  projectId: string
}

interface TaskMutationData {
  task: TaskFields
}

interface CreateTaskVariables {
  input: {
    projectId: string
    title: string
    description: string | null
    priority: 'LOW' | 'MEDIUM' | 'HIGH'
  }
}

interface TaskIdVariables {
  id: string
}

interface AssignTaskVariables extends TaskIdVariables {
  input: { assigneeId: string }
}

const TASK_FIELDS = gql`
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

export const TASKS_DOCUMENT: TypedDocumentNode<TasksData, TasksVariables> = gql`
  query Tasks($projectId: UUID!) {
    tasks(projectId: $projectId) {
      ...TaskFields
    }
  }
  ${TASK_FIELDS}
`

export const CREATE_TASK_DOCUMENT: TypedDocumentNode<
  TaskMutationData,
  CreateTaskVariables
> = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    task: createTask(input: $input) {
      ...TaskFields
    }
  }
  ${TASK_FIELDS}
`

export const COMPLETE_TASK_DOCUMENT: TypedDocumentNode<TaskMutationData, TaskIdVariables> = gql`
  mutation CompleteTask($id: UUID!) {
    task: completeTask(id: $id) {
      ...TaskFields
    }
  }
  ${TASK_FIELDS}
`

export const ASSIGN_TASK_DOCUMENT: TypedDocumentNode<TaskMutationData, AssignTaskVariables> = gql`
  mutation AssignTask($id: UUID!, $input: AssignTaskInput!) {
    task: assignTask(id: $id, input: $input) {
      ...TaskFields
    }
  }
  ${TASK_FIELDS}
`

export function toGraphqlPriority(priority: TaskPriority): CreateTaskVariables['input']['priority'] {
  return priority.toUpperCase() as CreateTaskVariables['input']['priority']
}

export function toTask(value: TaskFields): Task {
  return {
    id: taskId(value.id),
    projectId: projectId(value.projectId),
    title: value.title,
    description: value.description,
    status: taskStatus(value.status),
    priority: value.priority.toLowerCase() as TaskPriority,
    assigneeId: value.assigneeId === null ? null : userId(value.assigneeId),
    createdAt: dateValue(value.createdAt, 'creation'),
    completedAt: value.completedAt === null ? null : dateValue(value.completedAt, 'completion'),
  }
}

function taskStatus(value: TaskFields['status']): Task['status'] {
  if (value === 'IN_PROGRESS') return 'in-progress'
  return value.toLowerCase() as Task['status']
}

function dateValue(value: string, field: string): Date {
  const date = new Date(value)
  if (Number.isNaN(date.getTime()))
    throw new AppError(`The GraphQL API returned an invalid task ${field} date.`, 'unexpected')

  return date
}
