import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { authenticatedQueryMeta } from '@/shared/query/authenticatedQueries'
import { userId, type User } from '../../domain/user'
import { transitionToAnonymousSession } from './sessionCache'
import { sessionKeys } from './sessionQueries'

const currentUser: User = {
  id: userId('3f717f6d-5bbb-419a-ab56-0dca20d68474'),
  name: 'Grace Hopper',
  email: 'grace@example.com',
}

describe('session cache', () => {
  it('clears the session and authenticated data while preserving public data', async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(sessionKeys.current(), currentUser)
    queryClient.setQueryData(['announcements'], ['Maintenance tonight'])
    await queryClient.fetchQuery({
      queryKey: ['projects', 'list'],
      queryFn: () => Promise.resolve([{ id: 'project-id' }]),
      meta: authenticatedQueryMeta,
    })

    transitionToAnonymousSession(queryClient)

    expect(queryClient.getQueryData(sessionKeys.current())).toBeNull()
    expect(queryClient.getQueryData(['announcements'])).toEqual(['Maintenance tonight'])
    expect(queryClient.getQueryData(['projects', 'list'])).toBeUndefined()
  })
})
