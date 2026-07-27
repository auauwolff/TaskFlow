import { useMutation, useMutationState, useQueryClient } from '@tanstack/react-query'
import type { ProjectId, UserId } from '@/shared/domain/identity'
import { errorMessage } from '@/shared/errors/appError'
import type { TaskId } from '../../domain/task'
import { taskKeys } from '../taskKeys'
import { useTasksGateway } from '../tasksGatewayService'

interface AssignTaskVariables {
  id: TaskId
  assigneeId: UserId
}

export function useAssignTask(projectId: ProjectId) {
  const gateway = useTasksGateway()
  const queryClient = useQueryClient()
  const mutationKey = taskKeys.assign(projectId)

  const assignment = useMutation({
    mutationKey,
    mutationFn: ({ id, assigneeId }: AssignTaskVariables) => gateway.assign(id, assigneeId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) })
    },
  })

  // See the note in useCompleteTask: per-task pending state has to come from the MutationCache,
  // because one mutation observer cannot represent several concurrent calls.
  const assigningIds = useMutationState({
    filters: { mutationKey, status: 'pending' },
    select: mutation => (mutation.state.variables as AssignTaskVariables).id,
  })

  return {
    assign: (id: TaskId, assigneeId: UserId) => assignment.mutate({ id, assigneeId }),
    isAssigning: (id: TaskId) => assigningIds.includes(id),
    error: assignment.error === null ? null : errorMessage(assignment.error),
  }
}
