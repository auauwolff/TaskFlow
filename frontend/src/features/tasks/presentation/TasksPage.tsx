import type { ProjectId } from '@/shared/domain/identity'
import { CreateTaskForm } from './create-task/CreateTaskForm'
import { TaskList } from './task-list/TaskList'

export function TasksPage({ projectId }: { projectId: ProjectId }) {
  return (
    <div className="workspace-grid">
      <TaskList projectId={projectId} />
      <CreateTaskForm projectId={projectId} />
    </div>
  )
}
