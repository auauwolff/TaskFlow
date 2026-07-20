import { describe, expect, it, vi } from 'vitest'
import { projectId } from '@/features/projects/domain/project'
import { userId } from '@/features/session/domain/user'
import type { AntiforgeryClient } from '@/shared/api/antiforgery'
import type { ApiClient } from '@/shared/api/client'
import { taskId } from '../domain/task'
import { HttpTasksGateway } from './httpTasksGateway'

const project = projectId('5d3347f2-5e92-4476-96df-56c06f49d273')
const assignee = userId('3f717f6d-5bbb-419a-ab56-0dca20d68474')
const dto = {
  id: 'ab08cf9b-626f-4e84-b458-a10107addc52',
  projectId: project,
  title: 'Map the task API',
  description: 'Keep transport details at the boundary.',
  status: 'InProgress' as const,
  priority: 'High' as const,
  assigneeId: assignee,
  createdAt: '2026-07-19T10:00:00Z',
  completedAt: null,
}

function setup(client: Partial<ApiClient>) {
  const antiforgery: AntiforgeryClient = {
    header: vi.fn().mockResolvedValue({ 'X-CSRF-TOKEN': 'token' }),
    clear: vi.fn(),
  }
  return {
    antiforgery,
    gateway: new HttpTasksGateway(client as ApiClient, antiforgery),
  }
}

describe('HttpTasksGateway', () => {
  it('maps corrected string enums, identifiers, and dates from the task DTO', async () => {
    const get = vi.fn().mockResolvedValue({
      data: [dto],
      response: new Response(null, { status: 200 }),
    })
    const { gateway } = setup({ GET: get as ApiClient['GET'] })

    const tasks = await gateway.list(project)

    expect(get).toHaveBeenCalledWith('/api/tasks', {
      params: { query: { projectId: project } },
      signal: undefined,
    })
    expect(tasks).toEqual([
      {
        id: taskId(dto.id),
        projectId: project,
        title: dto.title,
        description: dto.description,
        status: 'in-progress',
        priority: 'high',
        assigneeId: assignee,
        createdAt: new Date(dto.createdAt),
        completedAt: null,
      },
    ])
  })

  it('maps lowercase priority to the create wire request and uses antiforgery', async () => {
    const post = vi.fn().mockResolvedValue({
      data: { ...dto, status: 'Todo', priority: 'Low', assigneeId: null },
      response: new Response(null, { status: 201 }),
    })
    const { antiforgery, gateway } = setup({ POST: post as ApiClient['POST'] })

    await gateway.create({
      projectId: project,
      title: 'Create adapter',
      description: null,
      priority: 'low',
    })

    expect(antiforgery.header).toHaveBeenCalledWith(undefined)
    expect(post).toHaveBeenCalledWith('/api/tasks', {
      body: {
        projectId: project,
        title: 'Create adapter',
        description: null,
        priority: 'Low',
      },
      headers: { 'X-CSRF-TOKEN': 'token' },
      signal: undefined,
    })
  })

  it('sends task-specific complete and assignment requests', async () => {
    const patch = vi.fn().mockResolvedValue({
      data: dto,
      response: new Response(null, { status: 200 }),
    })
    const { gateway } = setup({ PATCH: patch as ApiClient['PATCH'] })
    const id = taskId(dto.id)

    await gateway.complete(id)
    await gateway.assign(id, assignee)

    expect(patch).toHaveBeenNthCalledWith(1, '/api/tasks/{id}/complete', {
      params: { path: { id } },
      headers: { 'X-CSRF-TOKEN': 'token' },
      signal: undefined,
    })
    expect(patch).toHaveBeenNthCalledWith(2, '/api/tasks/{id}/assignee', {
      params: { path: { id } },
      body: { assigneeId: assignee },
      headers: { 'X-CSRF-TOKEN': 'token' },
      signal: undefined,
    })
  })

  it.each([
    ['status', { ...dto, status: 'Unknown' }, 'The API returned an invalid task status.'],
    ['priority', { ...dto, priority: 'Urgent' }, 'The API returned an invalid task priority.'],
    ['creation date', { ...dto, createdAt: 'not-a-date' }, 'The API returned an invalid task creation date.'],
    ['completion date', { ...dto, completedAt: 'not-a-date' }, 'The API returned an invalid task completion date.'],
  ])('rejects a malformed %s', async (_name, malformed, message) => {
    const get = vi.fn().mockResolvedValue({
      data: [malformed],
      response: new Response(null, { status: 200 }),
    })
    const { gateway } = setup({ GET: get as ApiClient['GET'] })

    await expect(gateway.list(project)).rejects.toMatchObject({
      kind: 'unexpected',
      message,
    })
  })

  it('clears antiforgery when a write returns an API error', async () => {
    const patch = vi.fn().mockResolvedValue({
      error: { detail: 'Task not found.' },
      response: new Response(null, { status: 404 }),
    })
    const { antiforgery, gateway } = setup({ PATCH: patch as ApiClient['PATCH'] })

    await expect(gateway.complete(taskId(dto.id))).rejects.toMatchObject({
      kind: 'not-found',
      message: 'Task not found.',
    })
    expect(antiforgery.clear).toHaveBeenCalledOnce()
  })
})
