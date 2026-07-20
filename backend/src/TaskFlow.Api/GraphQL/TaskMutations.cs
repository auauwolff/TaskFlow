using HotChocolate;
using TaskFlow.Application.Tasks;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Api.GraphQL;

public sealed record CreateTaskInput(
    Guid ProjectId,
    string Title,
    TaskPriority Priority,
    string? Description);

public sealed record AssignTaskInput(Guid AssigneeId);

public sealed class TaskMutations
{
    [GraphQLName("createTask")]
    public Task<TaskItemDto> CreateTaskAsync(
        CreateTaskInput input,
        ITaskService tasks,
        CancellationToken cancellationToken) =>
        tasks.CreateAsync(
            new CreateTaskRequest(input.ProjectId, input.Title, input.Priority, input.Description),
            cancellationToken);

    [GraphQLName("assignTask")]
    public Task<TaskItemDto> AssignTaskAsync(
        Guid id,
        AssignTaskInput input,
        ITaskService tasks,
        CancellationToken cancellationToken) =>
        tasks.AssignAsync(id, new AssignTaskRequest(input.AssigneeId), cancellationToken);

    [GraphQLName("completeTask")]
    public Task<TaskItemDto> CompleteTaskAsync(
        Guid id,
        ITaskService tasks,
        CancellationToken cancellationToken) =>
        tasks.CompleteAsync(id, cancellationToken);
}
