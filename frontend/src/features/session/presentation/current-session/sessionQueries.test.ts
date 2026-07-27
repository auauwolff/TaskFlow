import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import type { SessionUseCases } from '../../application/sessionService'
import { userId } from '@/shared/domain/identity'
import type { User } from '../../domain/user'
import { currentSessionOptions } from './sessionQueries'

const currentUser: User = {
  id: userId('3f717f6d-5bbb-419a-ab56-0dca20d68474'),
  name: 'Grace Hopper',
  email: 'grace@example.com',
}

function createService(user: User | null): SessionUseCases {
  return {
    restore: vi.fn().mockResolvedValue(user),
    signIn: vi.fn(),
    signOut: vi.fn(),
  }
}

describe('session queries', () => {
  it('shares the restored user through the Query cache', async () => {
    const service = createService(currentUser)
    const queryClient = new QueryClient()

    await expect(queryClient.fetchQuery(currentSessionOptions(service))).resolves.toEqual(currentUser)
    await expect(queryClient.fetchQuery(currentSessionOptions(service))).resolves.toEqual(currentUser)

    expect(service.restore).toHaveBeenCalledOnce()
  })
})
