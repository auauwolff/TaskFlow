import type { User } from '../domain/user'
import type { AuthenticationGateway } from './ports'

export interface SessionService {
  restore(signal?: AbortSignal): Promise<User | null>
  signIn(returnUrl: string): Promise<void>
  signOut(signal?: AbortSignal): Promise<void>
}

export function createSessionService(authentication: AuthenticationGateway): SessionService {
  return {
    restore: (signal) => authentication.current(signal),
    signIn: (returnUrl) => authentication.signIn(returnUrl),
    signOut: (signal) => authentication.signOut(signal),
  }
}
