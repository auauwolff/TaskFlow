import { useForm } from 'react-hook-form'
import type { ProjectId } from '@/shared/domain/identity'
import type { TaskPriority } from '../../domain/task'
import { useCreateTask } from './useCreateTask'

interface TaskFormValues {
  title: string
  description: string
  priority: TaskPriority
}

export function CreateTaskForm({ projectId }: { projectId: ProjectId }) {
  const creation = useCreateTask(projectId)
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<TaskFormValues>({
    defaultValues: { title: '', description: '', priority: 'medium' },
  })

  const submit = handleSubmit(async (values) => {
    const created = await creation.create({
      title: values.title.trim(),
      description: values.description.trim() || null,
      priority: values.priority,
    })
    if (created) reset()
  })

  return (
    <form className="form-card task-form" onSubmit={submit} noValidate>
      <div className="form-heading">
        <span className="step-number">+</span>
        <div>
          <h2>New task</h2>
          <p>Add the next concrete step.</p>
        </div>
      </div>

      <label>
        Task title
        <input
          {...register('title', {
            validate: (value) => value.trim().length > 0 || 'Enter a task title.',
            maxLength: { value: 200, message: 'Use 200 characters or fewer.' },
          })}
          maxLength={200}
          aria-invalid={errors.title !== undefined}
        />
      </label>
      {errors.title === undefined ? null : <p className="form-error" role="alert">{errors.title.message}</p>}

      <label>
        Priority
        <select {...register('priority')}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </label>

      <label>
        Description <span className="optional">optional</span>
        <textarea
          {...register('description', {
            maxLength: { value: 2000, message: 'Use 2,000 characters or fewer.' },
          })}
          maxLength={2000}
          rows={4}
          aria-invalid={errors.description !== undefined}
        />
      </label>
      {errors.description === undefined ? null : <p className="form-error" role="alert">{errors.description.message}</p>}

      {creation.error === null ? null : <p className="form-error" role="alert">{creation.error}</p>}
      <button className="primary-button" type="submit" disabled={creation.isCreating}>
        {creation.isCreating ? 'Creating...' : 'Create task'}
      </button>
    </form>
  )
}
