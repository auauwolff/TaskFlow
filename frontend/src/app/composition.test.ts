import { describe, expect, it } from 'vitest'
import { projectsGatewayToken } from '@/features/projects/presentation/projectsGatewayService'
import { sessionServiceToken } from '@/features/session/presentation/sessionService'
import { createAppRuntime } from './composition'

describe('createAppRuntime', () => {
  it('composes every feature entry service', () => {
    const runtime = createAppRuntime()

    expect(runtime.services.get(sessionServiceToken)).toBeDefined()
    expect(runtime.services.get(projectsGatewayToken)).toBeDefined()
    expect(runtime.apolloClient).toBeDefined()
  })
})
