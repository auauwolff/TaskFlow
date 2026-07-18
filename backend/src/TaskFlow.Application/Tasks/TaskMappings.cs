using TaskFlow.Domain.Entities;

namespace TaskFlow.Application.Tasks;

internal static class TaskMappings
{
    public static TaskItemDto ToDto(this TaskItem task) =>
        new(task.Id, task.ProjectId, task.Title, task.Description, task.Status,
            task.Priority, task.AssigneeId, task.CreatedAt, task.CompletedAt);
}
