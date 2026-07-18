import type { User, UserId } from '../domain/user'

export interface CreateUserInput {
  name: string
  email: string
}

export interface UsersGateway {
  getById(id: UserId, signal?: AbortSignal): Promise<User>
  create(input: CreateUserInput, signal?: AbortSignal): Promise<User>
}

export interface CurrentUserStorage {
  read(): UserId | null
  write(id: UserId): void
  clear(): void
}
