import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApiClient } from './client'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('API client', () => {
  it('reports unauthorized responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ title: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/problem+json' },
        }),
      ),
    )
    const onUnauthorized = vi.fn()
    const client = createApiClient(onUnauthorized, 'https://taskflow.test')

    await client.GET('/api/projects')

    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('ignores successful responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )
    const onUnauthorized = vi.fn()
    const client = createApiClient(onUnauthorized, 'https://taskflow.test')

    await client.GET('/api/projects')

    expect(onUnauthorized).not.toHaveBeenCalled()
  })
})
