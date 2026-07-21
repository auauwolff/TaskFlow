import { apiError, networkError } from './apiError'
import type { ApiClient } from './client'

export interface AntiforgeryClient {
  header(): Promise<Record<'X-CSRF-TOKEN', string>>
  clear(): void
}

export class HttpAntiforgeryClient implements AntiforgeryClient {
  private readonly client: ApiClient
  private token: Promise<string> | null = null

  constructor(client: ApiClient) {
    this.client = client
  }

  async header(): Promise<Record<'X-CSRF-TOKEN', string>> {
    this.token ??= this.loadToken().catch((error) => {
      this.token = null
      throw error
    })

    return { 'X-CSRF-TOKEN': await this.token }
  }

  clear(): void {
    this.token = null
  }

  // The token is a memoized, cross-request resource, so it is not bound to any single
  // caller's AbortSignal: cancelling one request (e.g. a Strict Mode double-render) must
  // never reject the shared fetch that other in-flight requests are awaiting.
  private async loadToken(): Promise<string> {
    try {
      const { data, error, response } = await this.client.GET('/api/auth/antiforgery')
      if (data !== undefined) return data.token
      throw apiError(response, error)
    } catch (error) {
      throw networkError(error)
    }
  }
}
