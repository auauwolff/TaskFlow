import { queryOptions } from '@tanstack/react-query'
import type { SessionUseCases } from '../application/sessionService'

export const sessionKeys = {
  all: ['session'] as const,
  current: () => [...sessionKeys.all, 'current'] as const,
}

export function currentSessionOptions(service: SessionUseCases) {
  return queryOptions({
    queryKey: sessionKeys.current(),
    queryFn: ({ signal }) => service.restore(signal),
    staleTime: 30_000,
  })
}
