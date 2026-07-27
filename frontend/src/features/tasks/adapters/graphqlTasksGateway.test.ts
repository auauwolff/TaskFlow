import { describe, expect, it } from 'vitest'
import { projectId } from '@/shared/domain/identity'
import type { GraphqlClient } from '@/shared/graphql/client'
import type { TypedDocumentString } from '@/shared/graphql/generated/graphql'
import { GraphqlTasksGateway } from './graphqlTasksGateway'

const wireTask = {
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

class StubGraphqlClient implements GraphqlClient {
  lastVariables: Record<string, unknown> | undefined
  private readonly payload: unknown

  constructor(payload: unknown) {
    this.payload = payload
  }

  async request<TData, TVariables>(
    _document: TypedDocumentString<TData, TVariables>,
    variables?: TVariables,
  ): Promise<TData> {
    this.lastVariables = variables as Record<string, unknown> | undefined
    return this.payload as TData
  }
}

describe('GraphqlTasksGateway', () => {
  it('maps GraphQL wire values into the transport-independent task model', async () => {
    const gateway = new GraphqlTasksGateway(new StubGraphqlClient({ tasks: [wireTask] }))

    const [task] = await gateway.list(projectId(wireTask.projectId))

    expect(task).toMatchObject({
      id: wireTask.id,
      projectId: wireTask.projectId,
      status: 'in-progress',
      priority: 'high',
      assigneeId: wireTask.assigneeId,
    })
  })

  it('translates domain priorities into GraphQL enum values before sending', async () => {
    const client = new StubGraphqlClient({ task: wireTask })
    const gateway = new GraphqlTasksGateway(client)

    await gateway.create({
      projectId: projectId(wireTask.projectId),
      title: 'New task',
      description: null,
      priority: 'medium',
    })

    expect(client.lastVariables).toMatchObject({ input: { priority: 'MEDIUM' } })
  })

  it('rejects malformed wire dates at the transport boundary', async () => {
    const gateway = new GraphqlTasksGateway(
      new StubGraphqlClient({ tasks: [{ ...wireTask, createdAt: 'not-a-date' }] }),
    )

    await expect(gateway.list(projectId(wireTask.projectId))).rejects.toThrow(
      'The GraphQL API returned an invalid task creation date.',
    )
  })
})
