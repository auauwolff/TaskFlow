using HotChocolate;
using TaskFlow.Application.Tasks;

namespace TaskFlow.Api.GraphQL;

public sealed class TaskQueries
{
    [GraphQLName("task")]
    public Task<TaskItemDto> GetTaskAsync(
        Guid id,
        ITaskService tasks,
        CancellationToken cancellationToken) =>
        tasks.GetByIdAsync(id, cancellationToken);

    [GraphQLName("tasks")]
    public Task<IReadOnlyList<TaskItemDto>> GetTasksAsync(
        Guid projectId,
        ITaskService tasks,
        CancellationToken cancellationToken) =>
        tasks.ListByProjectAsync(projectId, cancellationToken);
}
