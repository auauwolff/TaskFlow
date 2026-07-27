import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import type { ProjectsGateway } from '../../application/ports'
import { projectId } from '@/shared/domain/identity'
import type { Project } from '../../domain/project'
import { projectOptions } from './projectQueries'

describe('project detail query', () => {
  it('isolates cached projects by route id', async () => {
    const firstId = projectId('11111111-1111-1111-1111-111111111111')
    const secondId = projectId('22222222-2222-2222-2222-222222222222')
    const gateway = {
      get: vi.fn((id: Project['id']) => Promise.resolve({ id, name: id, createdAt: new Date() })),
    } as unknown as ProjectsGateway
    const queryClient = new QueryClient()

    await queryClient.fetchQuery(projectOptions(gateway, firstId))
    await queryClient.fetchQuery(projectOptions(gateway, secondId))

    expect(gateway.get).toHaveBeenCalledTimes(2)
    expect(queryClient.getQueryData(projectOptions(gateway, firstId).queryKey)).toMatchObject({
      id: firstId,
    })
    expect(queryClient.getQueryData(projectOptions(gateway, secondId).queryKey)).toMatchObject({
      id: secondId,
    })
  })
})
