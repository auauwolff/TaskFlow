import type { UserId } from '@/features/session/domain/user'
import { userId } from '@/features/session/domain/user'
import { apiError, networkError } from '@/shared/api/apiError'
import type { ApiClient } from '@/shared/api/client'
import type { components } from '@/shared/api/schema'
import { AppError } from '@/shared/errors/appError'
import type { CreateProjectInput, ProjectsGateway } from '../application/ports'
import { projectId, type Project } from '../domain/project'

type ProjectDto = components['schemas']['ProjectDto']

export function createHttpProjectsGateway(client: ApiClient): ProjectsGateway {
  return {
    async listByOwner(ownerId: UserId, signal?: AbortSignal) {
      try {
        const { data, error, response } = await client.GET('/api/projects', {
          params: { query: { ownerId } },
          signal,
        })

        if (data !== undefined) return data.map(toProject)
        throw apiError(response, error)
      } catch (error) {
        throw networkError(error)
      }
    },

    async create(input: CreateProjectInput, signal?: AbortSignal) {
      try {
        const { data, error, response } = await client.POST('/api/projects', {
          body: input,
          signal,
        })

        if (data !== undefined) return toProject(data)
        throw apiError(response, error)
      } catch (error) {
        throw networkError(error)
      }
    },
  }
}

function toProject(dto: ProjectDto): Project {
  const createdAt = new Date(dto.createdAt)

  if (Number.isNaN(createdAt.getTime()))
    throw new AppError('The API returned an invalid project creation date.', 'unexpected')

  return {
    id: projectId(dto.id),
    name: dto.name,
    description: dto.description,
    ownerId: userId(dto.ownerId),
    createdAt,
  }
}
