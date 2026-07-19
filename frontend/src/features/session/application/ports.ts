import type { User } from '../domain/user'

export interface AuthenticationGateway {
  current(signal?: AbortSignal): Promise<User | null>
  signIn(returnUrl: string): Promise<void>
  signOut(signal?: AbortSignal): Promise<void>
}
