import { apiError, networkError } from './apiError'
import type { ApiClient } from './client'

export interface AntiforgeryClient {
  header(): Promise<Record<'X-CSRF-TOKEN', string>>
  clear(): void
}

/**
 * Drops the memoized token only when the response says the token itself was the problem: the
 * backend rejects a stale or missing CSRF token with 400 (AntiforgeryValidationException) and
 * denies with 403. Other failures (404, 409, 500) say nothing about the token, and clearing it
 * there would force a needless re-fetch before the next mutation.
 */
export function clearIfTokenRejected(antiforgery: AntiforgeryClient, response: Response): void {
  if (response.status === 400 || response.status === 403) antiforgery.clear()
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
