import { describe, expect, it } from 'vitest'
import { taskId } from './task'

describe('taskId', () => {
  it('accepts a GUID', () => {
    expect(taskId('a1b2c3d4-1111-2222-3333-444455556666'))
      .toBe('a1b2c3d4-1111-2222-3333-444455556666')
  })

  it('rejects an invalid value', () => {
    expect(() => taskId('not-a-task-id')).toThrow('A valid task ID is required.')
  })
})
