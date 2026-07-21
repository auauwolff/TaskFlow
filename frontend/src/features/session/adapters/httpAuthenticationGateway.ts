import { apiError, networkError } from '@/shared/api/apiError'
import type { ApiClient } from '@/shared/api/client'
import type { AntiforgeryClient } from '@/shared/api/antiforgery'
import type { components } from '@/shared/api/schema'
import { AppError } from '@/shared/errors/appError'
import type { AuthenticationGateway } from '../application/ports'
import { userId, type User } from '../domain/user'

type UserDto = components['schemas']['UserDto']

export class HttpAuthenticationGateway implements AuthenticationGateway {
  private readonly client: ApiClient
  private readonly antiforgery: AntiforgeryClient

  constructor(client: ApiClient, antiforgery: AntiforgeryClient) {
    this.client = client
    this.antiforgery = antiforgery
  }

  async current(signal?: AbortSignal): Promise<User | null> {
    try {
      const { data, error, response } = await this.client.GET('/api/auth/me', { signal })

      if (data !== undefined) return toUser(data)
      if (response.status === 401) return null
      throw apiError(response, error)
    } catch (error) {
      throw networkError(error)
    }
  }

  async signIn(returnUrl: string): Promise<void> {
    const query = new URLSearchParams({ returnUrl })
    window.location.assign(`/api/auth/login?${query}`)
  }

  async signOut(_signal?: AbortSignal): Promise<void> {
    try {
      const header = await this.antiforgery.header()
      const form = document.createElement('form')
      const token = document.createElement('input')
      form.method = 'post'
      form.action = '/api/auth/logout?returnUrl=%2F'
      token.type = 'hidden'
      token.name = '__RequestVerificationToken'
      token.value = header['X-CSRF-TOKEN']
      form.append(token)
      document.body.append(form)
      this.antiforgery.clear()
      form.submit()
    } catch (error) {
      if (error instanceof AppError && error.kind === 'unauthorized') {
        this.antiforgery.clear()
        return
      }
      throw networkError(error)
    }
  }
}

function toUser(dto: UserDto): User {
  return {
    id: userId(dto.id),
    name: dto.name,
    email: dto.email,
  }
}
