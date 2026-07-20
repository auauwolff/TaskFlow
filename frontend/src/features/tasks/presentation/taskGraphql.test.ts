import { describe, expect, it } from 'vitest'
import { toGraphqlPriority, toTask } from './taskGraphql'

const task = {
  __typename: 'TaskItemDto' as const,
  id: '00000000-0000-4000-8000-000000000001',
  projectId: '00000000-0000-4000-8000-000000000002',
  title: 'Map GraphQL',
  description: null,
  status: 'IN_PROGRESS' as const,
  priority: 'HIGH' as const,
  assigneeId: '00000000-0000-4000-8000-000000000003',
  createdAt: '2026-07-20T10:00:00Z',
  completedAt: null,
}

describe('task GraphQL boundary', () => {
  it('maps GraphQL wire values into the transport-independent task model', () => {
    expect(toTask(task)).toMatchObject({
      id: task.id,
      projectId: task.projectId,
      status: 'in-progress',
      priority: 'high',
      assigneeId: task.assigneeId,
    })
  })

  it('maps domain priorities into GraphQL enum values', () => {
    expect(toGraphqlPriority('low')).toBe('LOW')
    expect(toGraphqlPriority('medium')).toBe('MEDIUM')
    expect(toGraphqlPriority('high')).toBe('HIGH')
  })

  it('rejects malformed GraphQL dates at the boundary', () => {
    expect(() => toTask({ ...task, createdAt: 'not-a-date' })).toThrow(
      'The GraphQL API returned an invalid task creation date.',
    )
  })
})
