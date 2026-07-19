import { useMutation, useQueryClient } from '@tanstack/react-query'
import { errorMessage } from '@/shared/errors/appError'
import { transitionToAnonymousSession } from '../current-session/sessionCache'
import { useSessionService } from '../sessionContext'

export function useSignOut() {
  const service = useSessionService()
  const queryClient = useQueryClient()
  const signOut = useMutation({
    mutationFn: () => service.signOut(),
    onSuccess: () => {
      transitionToAnonymousSession(queryClient)
    },
  })

  return {
    error: signOut.error === null ? null : errorMessage(signOut.error),
    isSigningOut: signOut.isPending,
    signOut: () => signOut.mutate(),
  }
}
