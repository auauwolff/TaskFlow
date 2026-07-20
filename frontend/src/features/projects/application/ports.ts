import type { Project, ProjectId } from '../domain/project'

export interface CreateProjectInput {
  name: string
  description: string | null
}

export interface ProjectsGateway {
  list(signal?: AbortSignal): Promise<Project[]>
  get(id: ProjectId, signal?: AbortSignal): Promise<Project>
  create(input: CreateProjectInput, signal?: AbortSignal): Promise<Project>
}
