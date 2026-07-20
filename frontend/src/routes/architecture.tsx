/* oxlint-disable react/only-export-components -- Route modules export TanStack's route contract. */
import { createFileRoute } from '@tanstack/react-router'
import { ArchitectureExplorer } from '@/features/architecture/presentation/ArchitectureExplorer'

export const Route = createFileRoute('/architecture')({
  component: ArchitectureExplorer,
})
