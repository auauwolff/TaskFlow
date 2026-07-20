import { describe, expect, it } from 'vitest'
import { TasksWorkspaceViewStore } from './tasksWorkspaceViewStore'

describe('TasksWorkspaceViewStore', () => {
  it('derives task visibility from project-scoped interaction state', () => {
    const store = new TasksWorkspaceViewStore()

    store.setFilter('open')
    expect(store.shows('todo')).toBe(true)
    expect(store.shows('done')).toBe(false)

    store.setFilter('completed')
    expect(store.shows('todo')).toBe(false)
    expect(store.shows('done')).toBe(true)
  })
})
