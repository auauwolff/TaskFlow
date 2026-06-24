namespace TaskFlow.Application.Tasks;

public interface ITaskService
{
    Task<TaskItemDto> CreateAsync(CreateTaskRequest request, CancellationToken cancellationToken = default);
    Task<TaskItemDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TaskItemDto>> ListByProjectAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task<TaskItemDto> CompleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<TaskItemDto> AssignAsync(Guid id, AssignTaskRequest request, CancellationToken cancellationToken = default);
}
