import { createContext, useContext } from 'react'
import type { SessionUseCases } from '../application/sessionService'

export const SessionServiceContext = createContext<SessionUseCases | null>(null)

export function useSessionService(): SessionUseCases {
  const service = useContext(SessionServiceContext)

  if (service === null) throw new Error('SessionServiceContext is not configured.')

  return service
}
