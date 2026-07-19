import type { QueryClient } from '@tanstack/react-query'
import { removeAuthenticatedQueries } from '@/shared/query/authenticatedQueries'
import { sessionKeys } from './sessionQueries'

export function transitionToAnonymousSession(queryClient: QueryClient): void {
  removeAuthenticatedQueries(queryClient)
  queryClient.setQueryData(sessionKeys.current(), null)
}
