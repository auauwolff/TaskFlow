import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ProjectId } from '@/features/projects/domain/project'
import { errorMessage } from '@/shared/errors/appError'
import type { TaskPriority } from '../../domain/task'
import { taskKeys } from '../taskKeys'
import { useTasksGateway } from '../tasksGatewayService'
import { createTaskOptions } from './taskMutations'

export interface CreateTaskDraft {
  title: string
  description: string | null
  priority: TaskPriority
}

export function useCreateTask(projectId: ProjectId) {
  const gateway = useTasksGateway()
  const queryClient = useQueryClient()
  const creation = useMutation({
    ...createTaskOptions(gateway),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId), exact: true })
    },
  })

  return {
    create: async (draft: CreateTaskDraft) => {
      try {
        await creation.mutateAsync({ ...draft, projectId })
        return true
      } catch {
        return false
      }
    },
    error: creation.error === null ? null : errorMessage(creation.error),
    isCreating: creation.isPending,
  }
}
