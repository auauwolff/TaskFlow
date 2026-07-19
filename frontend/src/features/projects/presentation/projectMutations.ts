import { mutationOptions } from '@tanstack/react-query'
import type { CreateProjectInput, ProjectsGateway } from '../application/ports'

export function createProjectOptions(gateway: ProjectsGateway) {
  return mutationOptions({
    mutationKey: ['projects', 'create'] as const,
    mutationFn: (input: CreateProjectInput) => gateway.create(input),
  })
}
