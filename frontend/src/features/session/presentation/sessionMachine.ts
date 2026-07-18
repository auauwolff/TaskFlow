import { assign, fromPromise, setup } from 'xstate'
import type { CreateUserInput } from '../application/ports'
import type { SessionService } from '../application/sessionService'
import type { User } from '../domain/user'

interface SessionContext {
  user: User | null
  pendingUser: CreateUserInput | null
  error: unknown
}

type SessionEvent =
  | { type: 'session.create'; input: CreateUserInput }
  | { type: 'session.retry' }
  | { type: 'session.sign-out' }

const missingRestore = fromPromise<User | null, void>(() =>
  Promise.reject(new Error('The restore-session actor was not provided.')),
)
const missingCreate = fromPromise<User, CreateUserInput>(() =>
  Promise.reject(new Error('The create-user actor was not provided.')),
)
const missingClear = fromPromise<void, void>(() =>
  Promise.reject(new Error('The clear-session actor was not provided.')),
)

export const sessionMachine = setup({
  types: {
    context: {} as SessionContext,
    events: {} as SessionEvent,
  },
  actors: {
    restoreSession: missingRestore,
    createUser: missingCreate,
    clearSession: missingClear,
  },
}).createMachine({
  id: 'session',
  initial: 'restoring',
  context: {
    user: null,
    pendingUser: null,
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
        'session.create': {
          target: 'creating',
          actions: assign({
            pendingUser: ({ event }) => event.input,
            error: null,
          }),
        },
      },
    },
    creating: {
      invoke: {
        src: 'createUser',
        input: ({ context }) => {
          if (context.pendingUser === null)
            throw new Error('A pending user is required while creating a session.')

          return context.pendingUser
        },
        onDone: {
          target: 'ready',
          actions: assign({
            user: ({ event }) => event.output,
            pendingUser: null,
            error: null,
          }),
        },
        onError: {
          target: 'anonymous',
          actions: assign({
            pendingUser: null,
            error: ({ event }) => event.error,
          }),
        },
      },
    },
    ready: {
      on: {
        'session.sign-out': {
          target: 'clearing',
          actions: assign({ error: null }),
        },
      },
    },
    clearing: {
      invoke: {
        src: 'clearSession',
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
      createUser: fromPromise(({ input, signal }) => service.create(input, signal)),
      clearSession: fromPromise(() => service.clear()),
    },
  })
}
