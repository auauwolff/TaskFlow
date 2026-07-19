import { useMutation, useQueryClient } from '@tanstack/react-query'
import { errorMessage } from '@/shared/errors/appError'
import { removeAuthenticatedQueries } from '@/shared/query/authenticatedQueries'
import { sessionKeys } from '../current-session/sessionQueries'
import { useSessionService } from '../sessionContext'

export function useSignOut() {
  const service = useSessionService()
  const queryClient = useQueryClient()
  const signOut = useMutation({
    mutationFn: () => service.signOut(),
    onSuccess: () => {
      removeAuthenticatedQueries(queryClient)
      queryClient.setQueryData(sessionKeys.current(), null)
    },
  })

  return {
    error: signOut.error === null ? null : errorMessage(signOut.error),
    isSigningOut: signOut.isPending,
    signOut: () => signOut.mutate(),
  }
}
