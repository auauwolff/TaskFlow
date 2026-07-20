import { describe, expect, it } from 'vitest'
import { projectId } from './project'

describe('projectId', () => {
  it('accepts a GUID', () => {
    expect(projectId('5d3347f2-5e92-4476-96df-56c06f49d273'))
      .toBe('5d3347f2-5e92-4476-96df-56c06f49d273')
  })

  it('rejects an invalid route value', () => {
    expect(() => projectId('not-a-project-id')).toThrow('A valid project ID is required.')
  })
})
