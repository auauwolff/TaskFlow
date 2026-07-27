import { useMutation, useMutationState, useQueryClient } from '@tanstack/react-query'
import type { ProjectId } from '@/shared/domain/identity'
import { errorMessage } from '@/shared/errors/appError'
import type { TaskId } from '../../domain/task'
import { taskKeys } from '../taskKeys'
import { useTasksGateway } from '../tasksGatewayService'

export function useCompleteTask(projectId: ProjectId) {
  const gateway = useTasksGateway()
  const queryClient = useQueryClient()
  const mutationKey = taskKeys.complete(projectId)

  const completion = useMutation({
    mutationKey,
    mutationFn: (id: TaskId) => gateway.complete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) })
    },
  })

  // A single `useMutation` observer only ever reflects its most recent call, so the previous
  // `useState<TaskId | null>` could not describe two tasks completing at once: starting the second
  // overwrote the first, and the first row silently dropped out of its pending state while its
  // request was still in flight. The MutationCache tracks every call independently, so ask it.
  const completingIds = useMutationState({
    filters: { mutationKey, status: 'pending' },
    select: mutation => mutation.state.variables as TaskId,
  })

  return {
    complete: (id: TaskId) => completion.mutate(id),
    isCompleting: (id: TaskId) => completingIds.includes(id),
    error: completion.error === null ? null : errorMessage(completion.error),
  }
}
