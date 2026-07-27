/* oxlint-disable react/only-export-components -- Route modules export TanStack's route contract. */
import { createFileRoute } from '@tanstack/react-router'
import { TaskFlowArchitecture } from '@/features/architecture/presentation/TaskFlowArchitecture'

export const Route = createFileRoute('/architecture')({
  component: TaskFlowArchitecture,
})
