import { userId } from '@/features/session/domain/user'
import { apiError, networkError } from '@/shared/api/apiError'
import type { AntiforgeryClient } from '@/shared/api/antiforgery'
import type { ApiClient } from '@/shared/api/client'
import type { components } from '@/shared/api/schema'
import { AppError } from '@/shared/errors/appError'
import type { CreateProjectInput, ProjectsGateway } from '../application/ports'
import { projectId, type Project } from '../domain/project'

type ProjectDto = components['schemas']['ProjectDto']

export function createHttpProjectsGateway(
  client: ApiClient,
  antiforgery: AntiforgeryClient,
): ProjectsGateway {
  return {
    async list(signal?: AbortSignal) {
      try {
        const { data, error, response } = await client.GET('/api/projects', {
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
          headers: await antiforgery.header(signal),
          signal,
        })

        if (data !== undefined) return toProject(data)
        antiforgery.clear()
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
