import { useMutation, useQueryClient } from '@tanstack/react-query'
import { errorMessage } from '@/shared/errors/appError'
import { createProjectOptions } from './projectMutations'
import { projectKeys } from './projectQueries'
import { useProjectsGateway } from './projectsGatewayContext'

export interface CreateProjectDraft {
  name: string
  description: string | null
}

export function useCreateProject() {
  const gateway = useProjectsGateway()
  const queryClient = useQueryClient()
  const creation = useMutation({
    ...createProjectOptions(gateway),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectKeys.list() })
    },
  })

  return {
    create: async (input: CreateProjectDraft) => {
      try {
        await creation.mutateAsync(input)
        return true
      } catch {
        return false
      }
    },
    error: creation.error === null ? null : errorMessage(creation.error),
    isCreating: creation.isPending,
  }
}
