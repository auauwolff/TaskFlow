import { userId } from '@/features/session/domain/user'
import { apiError, networkError } from '@/shared/api/apiError'
import { clearIfTokenRejected, type AntiforgeryClient } from '@/shared/api/antiforgery'
import type { ApiClient } from '@/shared/api/client'
import type { components } from '@/shared/api/schema'
import { AppError } from '@/shared/errors/appError'
import type { CreateProjectInput, ProjectsGateway } from '../application/ports'
import { projectId, type Project, type ProjectId } from '../domain/project'

type ProjectDto = components['schemas']['ProjectDto']

export class HttpProjectsGateway implements ProjectsGateway {
  private readonly client: ApiClient
  private readonly antiforgery: AntiforgeryClient

  constructor(client: ApiClient, antiforgery: AntiforgeryClient) {
    this.client = client
    this.antiforgery = antiforgery
  }

  async list(signal?: AbortSignal): Promise<Project[]> {
    try {
      const { data, error, response } = await this.client.GET('/api/projects', {
        signal,
      })

      if (data !== undefined) return data.map(toProject)
      throw apiError(response, error)
    } catch (error) {
      throw networkError(error)
    }
  }

  async get(id: ProjectId, signal?: AbortSignal): Promise<Project> {
    try {
      const { data, error, response } = await this.client.GET('/api/projects/{id}', {
        params: { path: { id } },
        signal,
      })

      if (data !== undefined) return toProject(data)
      throw apiError(response, error)
    } catch (error) {
      throw networkError(error)
    }
  }

  async create(input: CreateProjectInput, signal?: AbortSignal): Promise<Project> {
    try {
      const { data, error, response } = await this.client.POST('/api/projects', {
        body: input,
        headers: await this.antiforgery.header(),
        signal,
      })

      if (data !== undefined) return toProject(data)
      clearIfTokenRejected(this.antiforgery, response)
      throw apiError(response, error)
    } catch (error) {
      throw networkError(error)
    }
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
