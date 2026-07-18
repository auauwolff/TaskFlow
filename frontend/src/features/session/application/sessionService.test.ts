import { describe, expect, it, vi } from 'vitest'
import { AppError } from '@/shared/errors/appError'
import { userId, type User } from '../domain/user'
import type { CurrentUserStorage, UsersGateway } from './ports'
import { createSessionService } from './sessionService'

const existingUser: User = {
  id: userId('6731a3a4-1012-455c-9c71-2ac04285d882'),
  name: 'Ada Lovelace',
  email: 'ada@example.com',
}

function createStorage(initialId: string | null): CurrentUserStorage {
  let storedId = initialId === null ? null : userId(initialId)

  return {
    read: vi.fn(() => storedId),
    write: vi.fn((id) => {
      storedId = id
    }),
    clear: vi.fn(() => {
      storedId = null
    }),
  }
}

describe('createSessionService', () => {
  it('does not call the API when no user ID is stored', async () => {
    const users: UsersGateway = {
      getById: vi.fn(),
      create: vi.fn(),
    }
    const service = createSessionService(users, createStorage(null))

    await expect(service.restore()).resolves.toBeNull()
    expect(users.getById).not.toHaveBeenCalled()
  })

  it('clears a stale stored ID when the API no longer has that user', async () => {
    const storage = createStorage(existingUser.id)
    const users: UsersGateway = {
      getById: vi.fn().mockRejectedValue(new AppError('User was not found.', 'not-found', 404)),
      create: vi.fn(),
    }
    const service = createSessionService(users, storage)

    await expect(service.restore()).resolves.toBeNull()
    expect(storage.clear).toHaveBeenCalledOnce()
  })

  it('persists the ID returned by user creation', async () => {
    const storage = createStorage(null)
    const users: UsersGateway = {
      getById: vi.fn(),
      create: vi.fn().mockResolvedValue(existingUser),
    }
    const service = createSessionService(users, storage)

    await expect(
      service.create({ name: existingUser.name, email: existingUser.email }),
    ).resolves.toEqual(existingUser)
    expect(storage.write).toHaveBeenCalledWith(existingUser.id)
  })
})
