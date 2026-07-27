import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ProjectId } from '@/shared/domain/identity'
import { errorMessage } from '@/shared/errors/appError'
import type { TaskPriority } from '../../domain/task'
import { taskKeys } from '../taskKeys'
import { useTasksGateway } from '../tasksGatewayService'

export interface CreateTaskDraft {
  title: string
  description: string | null
  priority: TaskPriority
}

export function useCreateTask(projectId: ProjectId) {
  const gateway = useTasksGateway()
  const queryClient = useQueryClient()
  const creation = useMutation({
    mutationKey: ['tasks', 'create'] as const,
    mutationFn: (draft: CreateTaskDraft) => gateway.create({ ...draft, projectId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) })
    },
  })

  return {
    create: async (draft: CreateTaskDraft) => {
      try {
        await creation.mutateAsync(draft)
        return true
      } catch {
        return false
      }
    },
    error: creation.error === null ? null : errorMessage(creation.error),
    isCreating: creation.isPending,
  }
}
