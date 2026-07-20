import type { ProjectId } from '@/features/projects/domain/project'
import { useCurrentUser } from '@/features/session/presentation/current-session/useSession'
import { useAssignTask } from '../assign-task/useAssignTask'
import { useCompleteTask } from '../complete-task/useCompleteTask'
import { useTasksWorkspaceViewStore } from '../tasksWorkspaceViewStoreService'
import { useTasks } from './useTasks'

export const TaskList = observer(function TaskList({ projectId }: { projectId: ProjectId }) {
  const currentUser = useCurrentUser()
  const workspace = useTasksWorkspaceViewStore()
  const tasks = useTasks(projectId)
  const completion = useCompleteTask(projectId)
  const assignment = useAssignTask(projectId)
  const visibleTasks = tasks.status === 'ready'
    ? tasks.tasks.filter(task => workspace.shows(task.status))
    : []

  return (
    <section className="project-section" aria-live="polite">
      <div className="section-heading">
        <h2>Tasks</h2>
        {tasks.status === 'ready' ? <span>{tasks.tasks.length} total</span> : null}
      </div>
      <div className="inline-actions" aria-label="Filter tasks">
        {(['all', 'open', 'completed'] as const).map(filter => (
          <button
            className="text-button"
            type="button"
            aria-pressed={workspace.filter === filter}
            key={filter}
            onClick={() => workspace.setFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      {tasks.status === 'loading' ? <p className="muted-state">Loading tasks...</p> : null}
      {tasks.status === 'error' ? (
        <div className="error-state">
          <p>{tasks.message}</p>
          <button className="text-button" type="button" onClick={tasks.retry}>Try again</button>
        </div>
      ) : null}
      {tasks.status === 'ready' && tasks.tasks.length === 0 ? (
        <p className="muted-state">No tasks yet. Add the first one.</p>
      ) : null}
      {tasks.status === 'ready' && tasks.tasks.length > 0 && visibleTasks.length === 0 ? (
        <p className="muted-state">No tasks match this filter.</p>
      ) : null}
      {tasks.status === 'ready' && visibleTasks.length > 0 ? (
        <ol className="task-list">
          {visibleTasks.map((task, index) => (
            <li className={task.status === 'done' ? 'task-item task-item-complete' : 'task-item'} key={task.id}>
              <span className="project-index">{String(index + 1).padStart(2, '0')}</span>
              <div className="task-content">
                <h3>{task.title}</h3>
                <p>{task.description ?? 'No description'}</p>
                <div className="task-meta">
                  <span>{task.priority} priority</span>
                  <span>{task.status === 'in-progress' ? 'in progress' : task.status}</span>
                  <span>created {task.createdLabel}</span>
                </div>
                <p>
                  {task.assigneeId === null
                    ? 'Unassigned'
                    : task.assigneeId === currentUser.id
                      ? 'Assigned to you'
                      : 'Assigned to another user'}
                </p>
                {task.status === 'done' ? (
                  <p>{task.completedLabel === null ? 'Completed' : `Completed ${task.completedLabel}`}</p>
                ) : null}
                <div className="inline-actions">
                  {task.status === 'done' ? null : (
                    <button
                      className="text-button"
                      type="button"
                      disabled={completion.completingId === task.id}
                      onClick={() => completion.complete(task.id)}
                      aria-label={`Complete task: ${task.title}`}
                    >
                      {completion.completingId === task.id ? 'Completing...' : 'Complete'}
                    </button>
                  )}
                  {task.assigneeId === currentUser.id ? null : (
                    <button
                      className="text-button"
                      type="button"
                      disabled={assignment.assigningId === task.id}
                      onClick={() => assignment.assign(task.id, currentUser.id)}
                      aria-label={`Assign task to ${currentUser.name}: ${task.title}`}
                    >
                      {assignment.assigningId === task.id ? 'Assigning...' : 'Assign to me'}
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
      {completion.error === null ? null : <p className="form-error" role="alert">{completion.error}</p>}
      {assignment.error === null ? null : <p className="form-error" role="alert">{assignment.error}</p>}
    </section>
  )
})
import { observer } from 'mobx-react-lite'
