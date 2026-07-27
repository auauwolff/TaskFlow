import { describe, expect, it } from 'vitest'
import { projectId, userId } from './identity'

// Moved here from features/projects/domain/project.test.ts when ProjectId and UserId became shared
// kernel vocabulary. TaskId keeps its own test in features/tasks/domain/task.test.ts, because it is
// still owned by the tasks feature.

describe('projectId', () => {
  it('accepts a GUID', () => {
    expect(projectId('5d3347f2-5e92-4476-96df-56c06f49d273'))
      .toBe('5d3347f2-5e92-4476-96df-56c06f49d273')
  })

  it('rejects an invalid route value', () => {
    expect(() => projectId('not-a-project-id')).toThrow('A valid project ID is required.')
  })
})

describe('userId', () => {
  it('accepts a GUID', () => {
    expect(userId('9f8e7d6c-5b4a-3928-1716-0f0e0d0c0b0a'))
      .toBe('9f8e7d6c-5b4a-3928-1716-0f0e0d0c0b0a')
  })

  it('rejects a value the API should never have sent', () => {
    expect(() => userId('not-a-user-id')).toThrow('A valid user ID is required.')
  })
})
