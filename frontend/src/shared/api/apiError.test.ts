import { describe, expect, it } from 'vitest'
import { apiError } from './apiError'

describe('apiError', () => {
  it('maps validation Problem Details into an application error', () => {
    const response = new Response(null, { status: 400 })

    const error = apiError(response, {
      title: 'Validation failed',
      errors: { Name: ['Name is required.'] },
    })

    expect(error.kind).toBe('validation')
    expect(error.message).toBe('Validation failed')
    expect(error.fieldErrors).toEqual({ Name: ['Name is required.'] })
  })
})
