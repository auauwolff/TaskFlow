import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ProjectId } from '@/features/projects/domain/project'
import { errorMessage } from '@/shared/errors/appError'
import type { TaskId } from '../../domain/task'
import { taskKeys } from '../taskKeys'
import { useTasksGateway } from '../tasksGatewayService'
import { completeTaskOptions } from './taskMutations'

export function useCompleteTask(projectId: ProjectId) {
  const gateway = useTasksGateway()
  const queryClient = useQueryClient()
  const completion = useMutation({
    ...completeTaskOptions(gateway),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId), exact: true })
    },
  })

  return {
    complete: (id: TaskId) => completion.mutate(id),
    error: completion.error === null ? null : errorMessage(completion.error),
    completingId: completion.isPending ? completion.variables : null,
  }
}
