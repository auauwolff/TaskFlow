import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ProjectId } from '@/features/projects/domain/project'
import type { UserId } from '@/features/session/domain/user'
import { errorMessage } from '@/shared/errors/appError'
import type { TaskId } from '../../domain/task'
import { taskKeys } from '../taskKeys'
import { useTasksGateway } from '../tasksGatewayService'
import { assignTaskOptions } from './taskMutations'

export function useAssignTask(projectId: ProjectId) {
  const gateway = useTasksGateway()
  const queryClient = useQueryClient()
  const assignment = useMutation({
    ...assignTaskOptions(gateway),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId), exact: true })
    },
  })

  return {
    assign: (id: TaskId, assigneeId: UserId) => assignment.mutate({ id, assigneeId }),
    error: assignment.error === null ? null : errorMessage(assignment.error),
    assigningId: assignment.isPending ? assignment.variables.id : null,
  }
}
