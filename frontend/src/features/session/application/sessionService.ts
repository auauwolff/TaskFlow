import type { User } from '../domain/user'
import type { AuthenticationGateway } from './ports'

export interface SessionUseCases {
  restore(signal?: AbortSignal): Promise<User | null>
  signIn(returnUrl: string): Promise<void>
  signOut(signal?: AbortSignal): Promise<void>
}

export class SessionService implements SessionUseCases {
  private readonly authentication: AuthenticationGateway

  constructor(authentication: AuthenticationGateway) {
    this.authentication = authentication
  }

  restore(signal?: AbortSignal): Promise<User | null> {
    return this.authentication.current(signal)
  }

  signIn(returnUrl: string): Promise<void> {
    return this.authentication.signIn(returnUrl)
  }

  signOut(signal?: AbortSignal): Promise<void> {
    return this.authentication.signOut(signal)
  }
}
