import { useQuery } from '@tanstack/react-query'
import { errorMessage } from '@/shared/errors/appError'
import type { User } from '../../domain/user'
import { useSessionService } from '../sessionService'
import { currentSessionOptions } from './sessionQueries'

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
