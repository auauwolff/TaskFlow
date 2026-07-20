import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { projectId, type ProjectId } from '@/features/projects/domain/project'
import { authenticatedQueryMeta } from '@/shared/query/authenticatedQueries'
import type { TasksGateway } from '../../application/ports'
import { taskKeys } from '../taskKeys'
import { tasksOptions } from './taskQueries'

const firstProject = projectId('5d3347f2-5e92-4476-96df-56c06f49d273')
const secondProject = projectId('782d4f55-8367-42a9-971f-0c4e1cf4eb90')

describe('task queries', () => {
  it('uses authenticated, project-specific keys and keeps project caches isolated', async () => {
    const list = vi.fn((project: ProjectId) => Promise.resolve([{ project }]))
    const gateway = { list } as unknown as TasksGateway
    const queryClient = new QueryClient()

    const firstOptions = tasksOptions(gateway, firstProject)
    const secondOptions = tasksOptions(gateway, secondProject)
    await queryClient.fetchQuery(firstOptions)
    await queryClient.fetchQuery(secondOptions)

    expect(firstOptions.meta).toBe(authenticatedQueryMeta)
    expect(firstOptions.queryKey).toEqual(['tasks', 'list', firstProject])
    expect(secondOptions.queryKey).toEqual(['tasks', 'list', secondProject])
    expect(list).toHaveBeenNthCalledWith(1, firstProject, expect.any(AbortSignal))
    expect(list).toHaveBeenNthCalledWith(2, secondProject, expect.any(AbortSignal))
    expect(queryClient.getQueryData(taskKeys.list(firstProject))).toEqual([
      { project: firstProject },
    ])
    expect(queryClient.getQueryData(taskKeys.list(secondProject))).toEqual([
      { project: secondProject },
    ])
  })
})
