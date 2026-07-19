import type { QueryClient } from '@tanstack/react-query'

export const authenticatedQueryMeta = { authenticated: true } as const

export function removeAuthenticatedQueries(queryClient: QueryClient): void {
  queryClient.removeQueries({
    predicate: (query) => query.meta?.authenticated === true,
  })
}
