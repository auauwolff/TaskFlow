import type { Project } from '../domain/project'

export interface CreateProjectInput {
  name: string
  description: string | null
}

export interface ProjectsGateway {
  list(signal?: AbortSignal): Promise<Project[]>
  create(input: CreateProjectInput, signal?: AbortSignal): Promise<Project>
}
