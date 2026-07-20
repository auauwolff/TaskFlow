import { useMutation } from '@apollo/client/react'
import type { ProjectId } from '@/features/projects/domain/project'
import { errorMessage } from '@/shared/errors/appError'
import type { TaskPriority } from '../../domain/task'
import { CREATE_TASK_DOCUMENT, TASKS_DOCUMENT, toGraphqlPriority } from '../taskGraphql'

export interface CreateTaskDraft {
  title: string
  description: string | null
  priority: TaskPriority
}

export function useCreateTask(projectId: ProjectId) {
  const [createTask, creation] = useMutation(CREATE_TASK_DOCUMENT)

  return {
    create: async (draft: CreateTaskDraft) => {
      try {
        await createTask({
          variables: {
            input: {
              ...draft,
              projectId,
              priority: toGraphqlPriority(draft.priority),
            },
          },
          refetchQueries: [{ query: TASKS_DOCUMENT, variables: { projectId } }],
          awaitRefetchQueries: true,
        })
        return true
      } catch {
        return false
      }
    },
    error: creation.error === undefined ? null : errorMessage(creation.error),
    isCreating: creation.loading,
  }
}
