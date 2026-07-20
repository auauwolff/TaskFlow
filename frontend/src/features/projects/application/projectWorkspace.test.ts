import { describe, expect, it } from 'vitest'
import { ProjectWorkspaceScope } from './projectWorkspace'

describe('ProjectWorkspaceScope', () => {
  it('exposes a live signal until disposed', () => {
    const workspace = new ProjectWorkspaceScope()

    expect(workspace.signal.aborted).toBe(false)
  })

  it('aborts its signal on dispose so in-flight project work is cancelled', () => {
    const workspace = new ProjectWorkspaceScope()

    workspace.dispose()

    expect(workspace.signal.aborted).toBe(true)
  })
})
