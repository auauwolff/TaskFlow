import type { ApiClient } from '@/shared/api/client'
import { apiError, networkError } from '@/shared/api/apiError'
import type { components } from '@/shared/api/schema'
import type { CreateUserInput, UsersGateway } from '../application/ports'
import { userId, type User, type UserId } from '../domain/user'

type UserDto = components['schemas']['UserDto']

export function createHttpUsersGateway(client: ApiClient): UsersGateway {
  return {
    async getById(id: UserId, signal?: AbortSignal) {
      try {
        const { data, error, response } = await client.GET('/api/users/{id}', {
          params: { path: { id } },
          signal,
        })

        if (data !== undefined) return toUser(data)
        throw apiError(response, error)
      } catch (error) {
        throw networkError(error)
      }
    },

    async create(input: CreateUserInput, signal?: AbortSignal) {
      try {
        const { data, error, response } = await client.POST('/api/users', {
          body: input,
          signal,
        })

        if (data !== undefined) return toUser(data)
        throw apiError(response, error)
      } catch (error) {
        throw networkError(error)
      }
    },
  }
}

function toUser(dto: UserDto): User {
  return {
    id: userId(dto.id),
    name: dto.name,
    email: dto.email,
  }
}
