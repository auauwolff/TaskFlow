import createClient from 'openapi-fetch'
import type { paths } from './schema'

export type ApiClient = ReturnType<typeof createApiClient>

export function createApiClient() {
  return createClient<paths>({ baseUrl: '' })
}
