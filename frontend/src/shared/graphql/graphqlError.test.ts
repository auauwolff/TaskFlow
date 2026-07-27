import { describe, expect, it } from 'vitest'
import { apiError } from '@/shared/api/apiError'
import { graphqlError } from './graphqlError'

function graphqlFailure(code: string | undefined, message = 'Something failed.') {
  return [{ message, extensions: code === undefined ? undefined : { code } }]
}

describe('graphqlError', () => {
  it('preserves the first error message as the user-facing failure', () => {
    expect(graphqlError(graphqlFailure('NOT_FOUND', 'Project was not found.')).message)
      .toBe('Project was not found.')
  })

  it.each([
    ['VALIDATION', 'validation'],
    ['UNAUTHENTICATED', 'unauthorized'],
    ['NOT_FOUND', 'not-found'],
    ['CONFLICT', 'conflict'],
    ['BUSINESS_RULE', 'validation'],
  ])('maps the %s code to kind %s', (code, kind) => {
    expect(graphqlError(graphqlFailure(code)).kind).toBe(kind)
  })

  it('falls back to unexpected for an unrecognised code', () => {
    expect(graphqlError(graphqlFailure('SOMETHING_NEW')).kind).toBe('unexpected')
  })

  it('falls back to unexpected when the server sent no extensions', () => {
    expect(graphqlError(graphqlFailure(undefined)).kind).toBe('unexpected')
  })
})

// The point of the port seam is that a feature sees the same failure whichever transport its
// gateway uses. These assert that the two mapping tables agree, so a change to one without the
// other fails here rather than in a component that renders a different message per transport.
describe('parity with the REST mapping', () => {
  it.each([
    ['VALIDATION', 400],
    ['UNAUTHENTICATED', 401],
    ['NOT_FOUND', 404],
    ['CONFLICT', 409],
    ['BUSINESS_RULE', 400],
  ])('%s produces the same kind as HTTP %i', (code, status) => {
    const overGraphql = graphqlError(graphqlFailure(code))
    const overRest = apiError({ status } as Response, { detail: 'Something failed.' })

    expect(overGraphql.kind).toBe(overRest.kind)
  })
})
