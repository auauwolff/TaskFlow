import { errorMessage } from '@/shared/errors/appError'
import type { User } from '../domain/user'
import { SessionActorContext } from './sessionContext'

export type SessionViewModel =
  | { status: 'loading' }
  | {
      status: 'anonymous'
      error: string | null
      isSigningIn: boolean
      signIn(): void
    }
  | { status: 'failed'; message: string; retry(): void }
  | { status: 'ready'; user: User; error: string | null; signOut(): void }

export function useSession(): SessionViewModel {
  const actor = SessionActorContext.useActorRef()
  const snapshot = SessionActorContext.useSelector((value) => value)

  if (snapshot.matches('anonymous') || snapshot.matches('signingIn')) {
    return {
      status: 'anonymous',
      error: snapshot.context.error === null ? null : errorMessage(snapshot.context.error),
      isSigningIn: snapshot.matches('signingIn'),
      signIn: () => actor.send({ type: 'session.sign-in', returnUrl: '/' }),
    }
  }

  if (snapshot.matches('failed')) {
    return {
      status: 'failed',
      message: errorMessage(snapshot.context.error),
      retry: () => actor.send({ type: 'session.retry' }),
    }
  }

  if (
    (snapshot.matches('ready') || snapshot.matches('signingOut')) &&
    snapshot.context.user !== null
  ) {
    return {
      status: 'ready',
      user: snapshot.context.user,
      error: snapshot.context.error === null ? null : errorMessage(snapshot.context.error),
      signOut: () => actor.send({ type: 'session.sign-out' }),
    }
  }

  return { status: 'loading' }
}
