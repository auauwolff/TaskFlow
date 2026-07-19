import { describe, expect, it, vi } from 'vitest'
import { userId, type User } from '../domain/user'
import type { AuthenticationGateway } from './ports'
import { createSessionService } from './sessionService'

const existingUser: User = {
  id: userId('6731a3a4-1012-455c-9c71-2ac04285d882'),
  name: 'Ada Lovelace',
  email: 'ada@example.com',
}

function createAuthentication(): AuthenticationGateway {
  return {
    current: vi.fn().mockResolvedValue(existingUser),
    signIn: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
  }
}

describe('createSessionService', () => {
  it('restores the current user through the authentication port', async () => {
    const authentication = createAuthentication()
    const service = createSessionService(authentication)

    await expect(service.restore()).resolves.toEqual(existingUser)
    expect(authentication.current).toHaveBeenCalledOnce()
  })

  it('starts sign-in without knowing the configured identity provider', async () => {
    const authentication = createAuthentication()
    const service = createSessionService(authentication)

    await service.signIn('/')

    expect(authentication.signIn).toHaveBeenCalledWith('/')
  })

  it('signs out through the authentication port', async () => {
    const authentication = createAuthentication()
    const service = createSessionService(authentication)

    await service.signOut()

    expect(authentication.signOut).toHaveBeenCalledOnce()
  })
})
