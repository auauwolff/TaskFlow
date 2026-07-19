import createClient from 'openapi-fetch'
import type { paths } from './schema'

export type ApiClient = ReturnType<typeof createApiClient>

export function createApiClient(onUnauthorized: () => void, baseUrl = '') {
  const client = createClient<paths>({ baseUrl })

  client.use({
    onResponse: ({ response }) => {
      if (response.status === 401) onUnauthorized()
    },
  })

  return client
}
