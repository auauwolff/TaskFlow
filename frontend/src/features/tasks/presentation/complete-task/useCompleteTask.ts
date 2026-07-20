import { useMutation } from '@apollo/client/react'
import { useState } from 'react'
import type { ProjectId } from '@/features/projects/domain/project'
import { errorMessage } from '@/shared/errors/appError'
import type { TaskId } from '../../domain/task'
import { COMPLETE_TASK_DOCUMENT, TASKS_DOCUMENT } from '../taskGraphql'

export function useCompleteTask(projectId: ProjectId) {
  const [completeTask, completion] = useMutation(COMPLETE_TASK_DOCUMENT)
  const [completingId, setCompletingId] = useState<TaskId | null>(null)

  return {
    complete: (id: TaskId) => {
      setCompletingId(id)
      void completeTask({
        variables: { id },
        refetchQueries: [{ query: TASKS_DOCUMENT, variables: { projectId } }],
        awaitRefetchQueries: true,
      }).catch(() => undefined).finally(() => setCompletingId(null))
    },
    error: completion.error === undefined ? null : errorMessage(completion.error),
    completingId,
  }
}
