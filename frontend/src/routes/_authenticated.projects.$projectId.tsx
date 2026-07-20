/* oxlint-disable react/only-export-components -- Route modules export TanStack's route contract. */
import { createFileRoute } from '@tanstack/react-router'
import { projectId } from '@/features/projects/domain/project'
import { ProjectDetail } from '@/features/projects/presentation/project-detail/ProjectDetail'
import { addTasksWorkspaceScope } from '@/features/tasks/composition'
import { TasksPage } from '@/features/tasks/presentation/TasksPage'
import { ServiceScopeProvider } from '@/shared/ioc/react'

export const Route = createFileRoute('/_authenticated/projects/$projectId')({
  params: {
    parse: ({ projectId: value }) => ({ projectId: projectId(value) }),
    stringify: ({ projectId: value }) => ({ projectId: value }),
  },
  component: ProjectWorkspaceRoute,
})

function ProjectWorkspaceRoute() {
  const { projectId: selectedProjectId } = Route.useParams()

  return (
    <ServiceScopeProvider scopeKey={selectedProjectId} configure={addTasksWorkspaceScope}>
      <ProjectDetail projectId={selectedProjectId}>
        <TasksPage projectId={selectedProjectId} />
      </ProjectDetail>
    </ServiceScopeProvider>
  )
}
