import { useQuery } from '@tanstack/react-query'
import type { ProjectId } from '@/features/projects/domain/project'
import type { UserId } from '@/features/session/domain/user'
import { errorMessage } from '@/shared/errors/appError'
import type { TaskId, TaskPriority, TaskStatus } from '../../domain/task'
import { useTasksGateway } from '../tasksGatewayService'
import { tasksOptions } from './taskQueries'

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
  const gateway = useTasksGateway()
  const tasks = useQuery(tasksOptions(gateway, projectId))

  if (tasks.isPending) return { status: 'loading' }
  if (tasks.isError)
    return {
      status: 'error',
      message: errorMessage(tasks.error),
      retry: () => void tasks.refetch(),
    }

  return {
    status: 'ready',
    tasks: tasks.data.map((task) => ({
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
