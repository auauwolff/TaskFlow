using FluentValidation;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Repositories;

namespace TaskFlow.Application.Tasks;

public sealed class TaskService : ITaskService
{
    private readonly ITaskItemRepository _tasks;
    private readonly IProjectRepository _projects;
    private readonly IUserRepository _users;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IValidator<CreateTaskRequest> _createValidator;
    private readonly IValidator<AssignTaskRequest> _assignValidator;

    public TaskService(
        ITaskItemRepository tasks,
        IProjectRepository projects,
        IUserRepository users,
        IUnitOfWork unitOfWork,
        IValidator<CreateTaskRequest> createValidator,
        IValidator<AssignTaskRequest> assignValidator)
    {
        _tasks = tasks;
        _projects = projects;
        _users = users;
        _unitOfWork = unitOfWork;
        _createValidator = createValidator;
        _assignValidator = assignValidator;
    }

    public async Task<TaskItemDto> CreateAsync(CreateTaskRequest request, CancellationToken cancellationToken = default)
    {
        await _createValidator.ValidateAndThrowAsync(request, cancellationToken);

        if (await _projects.GetByIdAsync(request.ProjectId, cancellationToken) is null)
            throw new NotFoundException(nameof(Project), request.ProjectId);

        var task = TaskItem.Create(request.ProjectId, request.Title, request.Priority, request.Description);

        await _tasks.AddAsync(task, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return task.ToDto();
    }

    public async Task<TaskItemDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var task = await _tasks.GetByIdAsync(id, cancellationToken)
                   ?? throw new NotFoundException(nameof(TaskItem), id);

        return task.ToDto();
    }

    public async Task<IReadOnlyList<TaskItemDto>> ListByProjectAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        var tasks = await _tasks.ListByProjectAsync(projectId, cancellationToken);
        return tasks.Select(t => t.ToDto()).ToList();
    }

    public async Task<TaskItemDto> CompleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var task = await _tasks.GetByIdAsync(id, cancellationToken)
                   ?? throw new NotFoundException(nameof(TaskItem), id);

        // The RULE lives in the entity. The service only orchestrates: load -> act -> save.
        // If the task is already Done, TaskItem.Complete() is a no-op (idempotent).
        task.Complete();

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return task.ToDto();
    }

    public async Task<TaskItemDto> AssignAsync(Guid id, AssignTaskRequest request, CancellationToken cancellationToken = default)
    {
        await _assignValidator.ValidateAndThrowAsync(request, cancellationToken);

        var task = await _tasks.GetByIdAsync(id, cancellationToken)
                   ?? throw new NotFoundException(nameof(TaskItem), id);

        if (await _users.GetByIdAsync(request.AssigneeId, cancellationToken) is null)
            throw new NotFoundException(nameof(User), request.AssigneeId);

        task.AssignTo(request.AssigneeId);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return task.ToDto();
    }
}
