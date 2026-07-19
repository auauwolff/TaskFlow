import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { errorMessage } from '@/shared/errors/appError'
import { removeAuthenticatedQueries } from '@/shared/query/authenticatedQueries'
import type { User } from '../domain/user'
import { useSessionService } from './sessionContext'
import { currentSessionOptions, sessionKeys } from './sessionQueries'

export type SessionViewModel =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'failed'; message: string; retry(): void }
  | { status: 'ready'; user: User }

export function useSession(): SessionViewModel {
  const service = useSessionService()
  const session = useQuery(currentSessionOptions(service))

  if (session.isPending) return { status: 'loading' }

  if (session.isError) {
    return {
      status: 'failed',
      message: errorMessage(session.error),
      retry: () => void session.refetch(),
    }
  }

  if (session.data === null) return { status: 'anonymous' }

  return { status: 'ready', user: session.data }
}

export function useCurrentUser(): User {
  const session = useSession()

  if (session.status !== 'ready')
    throw new Error('useCurrentUser must be used inside an authenticated route.')

  return session.user
}

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
