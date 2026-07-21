import { clearIfTokenRejected, type AntiforgeryClient } from '@/shared/api/antiforgery'
import { apiError, networkError } from '@/shared/api/apiError'
import { AppError } from '@/shared/errors/appError'
import type { TypedDocumentString } from './generated/graphql'

export interface GraphqlClient {
  request<TData, TVariables>(
    document: TypedDocumentString<TData, TVariables>,
    variables?: TVariables,
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
// Documents are TypedDocumentString instances produced by codegen, so the response type is
// proven against the exported backend schema rather than asserted by the caller. It carries
// the same antiforgery + unauthorized policy as the REST client, so swapping a feature
// between transports never leaks below its gateway port.
export function createGraphqlClient({
  endpoint,
  antiforgery,
  onUnauthorized,
}: GraphqlClientOptions): GraphqlClient {
  return {
    async request<TData, TVariables>(
      document: TypedDocumentString<TData, TVariables>,
      variables?: TVariables,
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
          body: JSON.stringify({ query: document.toString(), variables }),
          signal,
        })

        if (!response.ok) {
          clearIfTokenRejected(antiforgery, response)
          if (response.status === 401) onUnauthorized()
          throw apiError(response, await readBody(response))
        }

        const payload = (await response.json()) as GraphqlPayload<TData>
        // Policy: the first error message is the user-facing failure and partial data is
        // discarded — gateways map complete DTOs to domain objects and never patch holes.
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
