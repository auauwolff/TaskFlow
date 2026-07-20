import { useQuery } from '@apollo/client/react'
import type { ProjectId } from '@/features/projects/domain/project'
import type { UserId } from '@/features/session/domain/user'
import { errorMessage } from '@/shared/errors/appError'
import type { TaskId, TaskPriority, TaskStatus } from '../../domain/task'
import { TASKS_DOCUMENT, toTask } from '../taskGraphql'

export interface TaskListItem {
  id: TaskId
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  assigneeId: UserId | null
  createdLabel: string
  completedLabel: string | null
}

export type TasksModel =
  | { status: 'loading' }
  | { status: 'error'; message: string; retry(): void }
  | { status: 'ready'; tasks: TaskListItem[] }

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

export function useTasks(projectId: ProjectId): TasksModel {
  const tasks = useQuery(TASKS_DOCUMENT, { variables: { projectId } })

  if (tasks.loading && tasks.data === undefined) return { status: 'loading' }
  if (tasks.error !== undefined)
    return {
      status: 'error',
      message: errorMessage(tasks.error),
      retry: () => void tasks.refetch(),
    }

  return {
    status: 'ready',
    tasks: (tasks.data?.tasks ?? []).map(toTask).map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId,
      createdLabel: dateFormatter.format(task.createdAt),
      completedLabel: task.completedAt === null ? null : dateFormatter.format(task.completedAt),
    })),
  }
}
