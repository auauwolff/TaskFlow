import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, ServerError } from '@apollo/client'
import { SetContextLink } from '@apollo/client/link/context'
import { ErrorLink } from '@apollo/client/link/error'
import type { AntiforgeryClient } from '@/shared/api/antiforgery'

interface GraphqlClientOptions {
  antiforgery: AntiforgeryClient
  onUnauthorized(): void
}

export function createGraphqlClient({ antiforgery, onUnauthorized }: GraphqlClientOptions) {
  const errorLink = new ErrorLink(({ error }) => {
    if (ServerError.is(error) && error.statusCode === 401) onUnauthorized()
  })
  const antiforgeryLink = new SetContextLink(async (context) => ({
    ...context,
    headers: {
      ...context.headers,
      ...await antiforgery.header(),
    },
  }))
  const httpLink = new HttpLink({
    uri: '/api/graphql',
    credentials: 'same-origin',
  })

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([errorLink, antiforgeryLink, httpLink]),
  })
}
