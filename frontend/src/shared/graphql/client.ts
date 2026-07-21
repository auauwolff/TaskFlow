import type { AntiforgeryClient } from '@/shared/api/antiforgery'
import { apiError, networkError } from '@/shared/api/apiError'
import { AppError } from '@/shared/errors/appError'

export interface GraphqlClient {
  request<TData>(
    document: string,
    variables?: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<TData>
}

interface GraphqlClientOptions {
  endpoint: string
  antiforgery: AntiforgeryClient
  onUnauthorized(): void
}

interface GraphqlPayload<TData> {
  data?: TData
  errors?: readonly { readonly message: string }[]
}

// A deliberately tiny GraphQL transport: a GraphQL request is just a typed POST.
// It carries the same antiforgery + unauthorized policy as the REST client, so swapping
// a feature between transports never leaks below its gateway port.
export function createGraphqlClient({
  endpoint,
  antiforgery,
  onUnauthorized,
}: GraphqlClientOptions): GraphqlClient {
  return {
    async request<TData>(
      document: string,
      variables?: Record<string, unknown>,
      signal?: AbortSignal,
    ): Promise<TData> {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'content-type': 'application/json',
            accept: 'application/json',
            ...(await antiforgery.header()),
          },
          body: JSON.stringify({ query: document, variables }),
          signal,
        })

        if (!response.ok) {
          antiforgery.clear()
          if (response.status === 401) onUnauthorized()
          throw apiError(response, await readBody(response))
        }

        const payload = (await response.json()) as GraphqlPayload<TData>
        if (payload.errors !== undefined && payload.errors.length > 0)
          throw new AppError(payload.errors[0].message, 'unexpected')
        if (payload.data === undefined)
          throw new AppError('The GraphQL API returned an empty response.', 'unexpected')

        return payload.data
      } catch (error) {
        throw networkError(error)
      }
    },
  }
}

async function readBody(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return undefined
  }
}
