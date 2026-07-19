import { useMutation } from '@tanstack/react-query'
import { errorMessage } from '@/shared/errors/appError'
import { useSessionService } from '../sessionContext'

export function useSignIn() {
  const service = useSessionService()
  const signIn = useMutation({
    mutationFn: (returnUrl: string) => service.signIn(returnUrl),
  })

  return {
    error: signIn.error === null ? null : errorMessage(signIn.error),
    isSigningIn: signIn.isPending,
    signIn: (returnUrl = '/') => signIn.mutate(returnUrl),
  }
}
