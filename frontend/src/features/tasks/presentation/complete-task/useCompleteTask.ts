import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { ProjectId } from '@/features/projects/domain/project'
import { errorMessage } from '@/shared/errors/appError'
import type { TaskId } from '../../domain/task'
import { taskKeys } from '../taskKeys'
import { useTasksGateway } from '../tasksGatewayService'

export function useCompleteTask(projectId: ProjectId) {
  const gateway = useTasksGateway()
  const queryClient = useQueryClient()
  const [completingId, setCompletingId] = useState<TaskId | null>(null)
  const completion = useMutation({
    mutationFn: (id: TaskId) => gateway.complete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) })
    },
  })

  return {
    complete: (id: TaskId) => {
      setCompletingId(id)
      completion.mutate(id, { onSettled: () => setCompletingId(null) })
    },
    error: completion.error === null ? null : errorMessage(completion.error),
    completingId,
  }
}
