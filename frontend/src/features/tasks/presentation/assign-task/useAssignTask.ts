import { useMutation } from '@apollo/client/react'
import { useState } from 'react'
import type { ProjectId } from '@/features/projects/domain/project'
import type { UserId } from '@/features/session/domain/user'
import { errorMessage } from '@/shared/errors/appError'
import type { TaskId } from '../../domain/task'
import { ASSIGN_TASK_DOCUMENT, TASKS_DOCUMENT } from '../taskGraphql'

export function useAssignTask(projectId: ProjectId) {
  const [assignTask, assignment] = useMutation(ASSIGN_TASK_DOCUMENT)
  const [assigningId, setAssigningId] = useState<TaskId | null>(null)

  return {
    assign: (id: TaskId, assigneeId: UserId) => {
      setAssigningId(id)
      void assignTask({
        variables: { id, input: { assigneeId } },
        refetchQueries: [{ query: TASKS_DOCUMENT, variables: { projectId } }],
        awaitRefetchQueries: true,
      }).catch(() => undefined).finally(() => setAssigningId(null))
    },
    error: assignment.error === undefined ? null : errorMessage(assignment.error),
    assigningId,
  }
}
