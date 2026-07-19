import { apiError, networkError } from './apiError'
import type { ApiClient } from './client'

export interface AntiforgeryClient {
  header(signal?: AbortSignal): Promise<Record<'X-CSRF-TOKEN', string>>
  clear(): void
}

export class HttpAntiforgeryClient implements AntiforgeryClient {
  private readonly client: ApiClient
  private token: Promise<string> | null = null

  constructor(client: ApiClient) {
    this.client = client
  }

  async header(signal?: AbortSignal): Promise<Record<'X-CSRF-TOKEN', string>> {
    this.token ??= this.loadToken(signal).catch((error) => {
      this.token = null
      throw error
    })

    return { 'X-CSRF-TOKEN': await this.token }
  }

  clear(): void {
    this.token = null
  }

  private async loadToken(signal?: AbortSignal): Promise<string> {
    try {
      const { data, error, response } = await this.client.GET('/api/auth/antiforgery', {
        signal,
      })
      if (data !== undefined) return data.token
      throw apiError(response, error)
    } catch (error) {
      throw networkError(error)
    }
  }
}
