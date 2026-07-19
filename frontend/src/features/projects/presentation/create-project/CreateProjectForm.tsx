import { useForm } from 'react-hook-form'
import { useCreateProject } from './useCreateProject'

interface ProjectFormValues {
  name: string
  description: string
}

export function CreateProjectForm() {
  const creation = useCreateProject()
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<ProjectFormValues>({
    defaultValues: { name: '', description: '' },
  })

  const submit = handleSubmit(async (values) => {
    const created = await creation.create({
      name: values.name.trim(),
      description: values.description.trim() || null,
    })

    if (created) reset()
  })

  return (
    <form className="form-card project-form" onSubmit={submit} noValidate>
      <div className="form-heading">
        <span className="step-number">+</span>
        <div>
          <h2>New project</h2>
          <p>Start small. Tasks come next.</p>
        </div>
      </div>

      <label>
        Project name
        <input
          {...register('name', {
            validate: (value) => value.trim().length > 0 || 'Enter a project name.',
            maxLength: { value: 200, message: 'Use 200 characters or fewer.' },
          })}
          maxLength={200}
          aria-invalid={errors.name !== undefined}
        />
      </label>
      {errors.name === undefined ? null : (
        <p className="form-error" role="alert">
          {errors.name.message}
        </p>
      )}

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
      {errors.description === undefined ? null : (
        <p className="form-error" role="alert">
          {errors.description.message}
        </p>
      )}

      {creation.error === null ? null : (
        <p className="form-error" role="alert">
          {creation.error}
        </p>
      )}

      <button className="primary-button" type="submit" disabled={creation.isCreating}>
        {creation.isCreating ? 'Creating...' : 'Create project'}
      </button>
    </form>
  )
}
