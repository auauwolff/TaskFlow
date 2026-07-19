import { CreateProjectForm } from './create-project/CreateProjectForm'
import { ProjectList } from './project-list/ProjectList'

export function ProjectsPage() {
  return (
    <div className="workspace-grid">
      <ProjectList />
      <CreateProjectForm />
    </div>
  )
}
