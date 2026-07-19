import { createActor, waitFor } from 'xstate'
import { describe, expect, it, vi } from 'vitest'
import type { SessionUseCases } from '../application/sessionService'
import { userId, type User } from '../domain/user'
import { provideSessionMachine } from './sessionMachine'

const currentUser: User = {
  id: userId('3f717f6d-5bbb-419a-ab56-0dca20d68474'),
  name: 'Grace Hopper',
  email: 'grace@example.com',
}

describe('sessionMachine', () => {
  it('restores an authenticated session', async () => {
    const service: SessionUseCases = {
      restore: vi.fn().mockResolvedValue(currentUser),
      signIn: vi.fn(),
      signOut: vi.fn(),
    }
    const actor = createActor(provideSessionMachine(service)).start()

    const ready = await waitFor(actor, (snapshot) => snapshot.matches('ready'))

    expect(ready.context.user).toEqual(currentUser)
    actor.stop()
  })

  it('starts provider-neutral sign-in from an anonymous session', async () => {
    const service: SessionUseCases = {
      restore: vi.fn().mockResolvedValue(null),
      signIn: vi.fn().mockResolvedValue(undefined),
      signOut: vi.fn(),
    }
    const actor = createActor(provideSessionMachine(service)).start()

    await waitFor(actor, (snapshot) => snapshot.matches('anonymous'))
    actor.send({ type: 'session.sign-in', returnUrl: '/' })
    await waitFor(
      actor,
      (snapshot) => snapshot.matches('anonymous') && vi.mocked(service.signIn).mock.calls.length > 0,
    )

    expect(service.signIn).toHaveBeenCalledWith('/')
    actor.stop()
  })

  it('moves to anonymous after signing out', async () => {
    const service: SessionUseCases = {
      restore: vi.fn().mockResolvedValue(currentUser),
      signIn: vi.fn(),
      signOut: vi.fn().mockResolvedValue(undefined),
    }
    const actor = createActor(provideSessionMachine(service)).start()

    await waitFor(actor, (snapshot) => snapshot.matches('ready'))
    actor.send({ type: 'session.sign-out' })
    const anonymous = await waitFor(actor, (snapshot) => snapshot.matches('anonymous'))

    expect(anonymous.context.user).toBeNull()
    actor.stop()
  })

  it('keeps the current user ready when sign-out fails', async () => {
    const failure = new Error('Sign-out failed.')
    const service: SessionUseCases = {
      restore: vi.fn().mockResolvedValue(currentUser),
      signIn: vi.fn(),
      signOut: vi.fn().mockRejectedValue(failure),
    }
    const actor = createActor(provideSessionMachine(service)).start()

    await waitFor(actor, (snapshot) => snapshot.matches('ready'))
    actor.send({ type: 'session.sign-out' })
    const ready = await waitFor(
      actor,
      (snapshot) => snapshot.matches('ready') && snapshot.context.error !== null,
    )

    expect(ready.context.user).toEqual(currentUser)
    expect(ready.context.error).toBe(failure)
    actor.stop()
  })
})
