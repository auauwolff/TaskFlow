import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { ProjectId } from '@/features/projects/domain/project'
import type { UserId } from '@/features/session/domain/user'
import { errorMessage } from '@/shared/errors/appError'
import type { TaskId } from '../../domain/task'
import { taskKeys } from '../taskKeys'
import { useTasksGateway } from '../tasksGatewayService'

export function useAssignTask(projectId: ProjectId) {
  const gateway = useTasksGateway()
  const queryClient = useQueryClient()
  const [assigningId, setAssigningId] = useState<TaskId | null>(null)
  const assignment = useMutation({
    mutationFn: ({ id, assigneeId }: { id: TaskId; assigneeId: UserId }) =>
      gateway.assign(id, assigneeId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) })
    },
  })

  return {
    assign: (id: TaskId, assigneeId: UserId) => {
      setAssigningId(id)
      assignment.mutate({ id, assigneeId }, { onSettled: () => setAssigningId(null) })
    },
    error: assignment.error === null ? null : errorMessage(assignment.error),
    assigningId,
  }
}
