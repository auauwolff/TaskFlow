/* oxlint-disable react/only-export-components -- Route modules export TanStack's route contract. */
import { createFileRoute } from '@tanstack/react-router'
import { ProjectsPage } from '@/features/projects/presentation/ProjectsPage'

export const Route = createFileRoute('/_authenticated/')({
  component: ProjectsPage,
})
