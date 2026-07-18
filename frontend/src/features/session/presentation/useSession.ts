import { errorMessage } from '@/shared/errors/appError'
import type { CreateUserInput } from '../application/ports'
import type { User } from '../domain/user'
import { SessionActorContext } from './sessionContext'

export type SessionViewModel =
  | { status: 'loading' }
  | {
      status: 'anonymous'
      error: string | null
      isCreating: boolean
      createUser(input: CreateUserInput): void
    }
  | { status: 'failed'; message: string; retry(): void }
  | { status: 'ready'; user: User; error: string | null; signOut(): void }

export function useSession(): SessionViewModel {
  const actor = SessionActorContext.useActorRef()
  const snapshot = SessionActorContext.useSelector((value) => value)

  if (snapshot.matches('anonymous') || snapshot.matches('creating')) {
    return {
      status: 'anonymous',
      error: snapshot.context.error === null ? null : errorMessage(snapshot.context.error),
      isCreating: snapshot.matches('creating'),
      createUser: (input) => actor.send({ type: 'session.create', input }),
    }
  }

  if (snapshot.matches('failed')) {
    return {
      status: 'failed',
      message: errorMessage(snapshot.context.error),
      retry: () => actor.send({ type: 'session.retry' }),
    }
  }

  if (snapshot.matches('ready') && snapshot.context.user !== null) {
    return {
      status: 'ready',
      user: snapshot.context.user,
      error: snapshot.context.error === null ? null : errorMessage(snapshot.context.error),
      signOut: () => actor.send({ type: 'session.sign-out' }),
    }
  }

  return { status: 'loading' }
}
