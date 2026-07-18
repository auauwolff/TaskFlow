import { AppError } from '@/shared/errors/appError'
import type { User } from '../domain/user'
import type {
  CreateUserInput,
  CurrentUserStorage,
  UsersGateway,
} from './ports'

export interface SessionService {
  restore(signal?: AbortSignal): Promise<User | null>
  create(input: CreateUserInput, signal?: AbortSignal): Promise<User>
  clear(): Promise<void>
}

export function createSessionService(
  users: UsersGateway,
  storage: CurrentUserStorage,
): SessionService {
  return {
    async restore(signal) {
      const id = storage.read()

      if (id === null) return null

      try {
        return await users.getById(id, signal)
      } catch (error) {
        if (error instanceof AppError && error.kind === 'not-found') {
          storage.clear()
          return null
        }

        throw error
      }
    },

    async create(input, signal) {
      const user = await users.create(input, signal)
      storage.write(user.id)
      return user
    },

    async clear() {
      storage.clear()
    },
  }
}
