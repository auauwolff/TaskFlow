import { createActor, waitFor } from 'xstate'
import { describe, expect, it, vi } from 'vitest'
import type { SessionService } from '../application/sessionService'
import { userId, type User } from '../domain/user'
import { provideSessionMachine } from './sessionMachine'

const createdUser: User = {
  id: userId('3f717f6d-5bbb-419a-ab56-0dca20d68474'),
  name: 'Grace Hopper',
  email: 'grace@example.com',
}

describe('sessionMachine', () => {
  it('moves from anonymous to ready after creating a user', async () => {
    const service: SessionService = {
      restore: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(createdUser),
      clear: vi.fn().mockResolvedValue(undefined),
    }
    const actor = createActor(provideSessionMachine(service)).start()

    await waitFor(actor, (snapshot) => snapshot.matches('anonymous'))
    actor.send({
      type: 'session.create',
      input: { name: createdUser.name, email: createdUser.email },
    })
    const ready = await waitFor(actor, (snapshot) => snapshot.matches('ready'))

    expect(ready.context.user).toEqual(createdUser)
    expect(service.create).toHaveBeenCalledWith(
      { name: createdUser.name, email: createdUser.email },
      expect.any(AbortSignal),
    )
    actor.stop()
  })

  it('returns to anonymous with an error when user creation fails', async () => {
    const failure = new Error('Email is already registered.')
    const service: SessionService = {
      restore: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockRejectedValue(failure),
      clear: vi.fn().mockResolvedValue(undefined),
    }
    const actor = createActor(provideSessionMachine(service)).start()

    await waitFor(actor, (snapshot) => snapshot.matches('anonymous'))
    actor.send({
      type: 'session.create',
      input: { name: createdUser.name, email: createdUser.email },
    })
    const anonymous = await waitFor(
      actor,
      (snapshot) => snapshot.matches('anonymous') && snapshot.context.error !== null,
    )

    expect(anonymous.context.error).toBe(failure)
    actor.stop()
  })

  it('keeps the current user ready when clearing storage fails', async () => {
    const failure = new Error('Storage is unavailable.')
    const service: SessionService = {
      restore: vi.fn().mockResolvedValue(createdUser),
      create: vi.fn(),
      clear: vi.fn().mockRejectedValue(failure),
    }
    const actor = createActor(provideSessionMachine(service)).start()

    await waitFor(actor, (snapshot) => snapshot.matches('ready'))
    actor.send({ type: 'session.sign-out' })
    const ready = await waitFor(
      actor,
      (snapshot) => snapshot.matches('ready') && snapshot.context.error !== null,
    )

    expect(ready.context.user).toEqual(createdUser)
    expect(ready.context.error).toBe(failure)
    actor.stop()
  })
})
