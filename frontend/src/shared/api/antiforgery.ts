import { apiError, networkError } from './apiError'
import type { ApiClient } from './client'

export interface AntiforgeryClient {
  header(signal?: AbortSignal): Promise<Record<'X-CSRF-TOKEN', string>>
  clear(): void
}

export function createAntiforgeryClient(client: ApiClient): AntiforgeryClient {
  let token: Promise<string> | null = null

  return {
    async header(signal) {
      token ??= loadToken(client, signal).catch((error) => {
        token = null
        throw error
      })

      return { 'X-CSRF-TOKEN': await token }
    },
    clear: () => {
      token = null
    },
  }
}

async function loadToken(client: ApiClient, signal?: AbortSignal): Promise<string> {
  try {
    const { data, error, response } = await client.GET('/api/auth/antiforgery', { signal })
    if (data !== undefined) return data.token
    throw apiError(response, error)
  } catch (error) {
    throw networkError(error)
  }
}
