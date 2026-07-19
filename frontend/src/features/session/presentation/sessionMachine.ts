import { assign, fromPromise, setup } from 'xstate'
import type { SessionService } from '../application/sessionService'
import type { User } from '../domain/user'

interface SessionContext {
  user: User | null
  error: unknown
}

type SessionEvent =
  | { type: 'session.sign-in'; returnUrl: string }
  | { type: 'session.retry' }
  | { type: 'session.sign-out' }

const missingRestore = fromPromise<User | null, void>(() =>
  Promise.reject(new Error('The restore-session actor was not provided.')),
)
const missingSignIn = fromPromise<void, string>(() =>
  Promise.reject(new Error('The sign-in actor was not provided.')),
)
const missingSignOut = fromPromise<void, void>(() =>
  Promise.reject(new Error('The sign-out actor was not provided.')),
)

export const sessionMachine = setup({
  types: {
    context: {} as SessionContext,
    events: {} as SessionEvent,
  },
  actors: {
    restoreSession: missingRestore,
    signIn: missingSignIn,
    signOut: missingSignOut,
  },
}).createMachine({
  id: 'session',
  initial: 'restoring',
  context: {
    user: null,
    error: null,
  },
  states: {
    restoring: {
      invoke: {
        src: 'restoreSession',
        onDone: [
          {
            guard: ({ event }) => event.output !== null,
            target: 'ready',
            actions: assign({
              user: ({ event }) => event.output,
              error: null,
            }),
          },
          { target: 'anonymous' },
        ],
        onError: {
          target: 'failed',
          actions: assign({ error: ({ event }) => event.error }),
        },
      },
    },
    anonymous: {
      on: {
        'session.sign-in': {
          target: 'signingIn',
          actions: assign({ error: null }),
        },
      },
    },
    signingIn: {
      invoke: {
        src: 'signIn',
        input: ({ event }) => {
          if (event.type !== 'session.sign-in')
            throw new Error('A return URL is required while signing in.')

          return event.returnUrl
        },
        onDone: { target: 'anonymous' },
        onError: {
          target: 'anonymous',
          actions: assign({ error: ({ event }) => event.error }),
        },
      },
    },
    ready: {
      on: {
        'session.sign-out': {
          target: 'signingOut',
          actions: assign({ error: null }),
        },
      },
    },
    signingOut: {
      invoke: {
        src: 'signOut',
        onDone: {
          target: 'anonymous',
          actions: assign({ user: null, error: null }),
        },
        onError: {
          target: 'ready',
          actions: assign({ error: ({ event }) => event.error }),
        },
      },
    },
    failed: {
      on: {
        'session.retry': {
          target: 'restoring',
          actions: assign({ error: null }),
        },
      },
    },
  },
})

export function provideSessionMachine(service: SessionService) {
  return sessionMachine.provide({
    actors: {
      restoreSession: fromPromise(({ signal }) => service.restore(signal)),
      signIn: fromPromise(({ input }) => service.signIn(input)),
      signOut: fromPromise(({ signal }) => service.signOut(signal)),
    },
  })
}
