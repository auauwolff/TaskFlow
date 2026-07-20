import { createServiceToken } from '@/shared/ioc/core'
import { useService } from '@/shared/ioc/react'
import type { SessionUseCases } from '../application/sessionService'

export const sessionServiceToken = createServiceToken<SessionUseCases>('SessionService')

export function useSessionService(): SessionUseCases {
  return useService(sessionServiceToken)
}
