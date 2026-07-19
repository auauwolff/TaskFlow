import { describe, expect, it, vi } from 'vitest'
import type { ApiClient } from './client'
import { HttpAntiforgeryClient } from './antiforgery'

describe('HttpAntiforgeryClient', () => {
  it('reuses a token until the authenticated boundary clears it', async () => {
    const get = vi
      .fn()
      .mockResolvedValueOnce({
        data: { token: 'first-token' },
        response: new Response(null, { status: 200 }),
      })
      .mockResolvedValueOnce({
        data: { token: 'second-token' },
        response: new Response(null, { status: 200 }),
      })
    const client = { GET: get } as unknown as ApiClient
    const antiforgery = new HttpAntiforgeryClient(client)

    await expect(antiforgery.header()).resolves.toEqual({
      'X-CSRF-TOKEN': 'first-token',
    })
    await antiforgery.header()
    expect(get).toHaveBeenCalledOnce()

    antiforgery.clear()

    await expect(antiforgery.header()).resolves.toEqual({
      'X-CSRF-TOKEN': 'second-token',
    })
    expect(get).toHaveBeenCalledTimes(2)
  })
})
