using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Tasks;

// We reuse the domain enums (TaskItemStatus/TaskPriority) directly in these DTOs. That's a small,
// deliberate coupling that keeps things simple; if the API contract ever needed to diverge from
// the domain, we'd introduce separate API-side enums and map between them.

public sealed record TaskItemDto(
    Guid Id,
    Guid ProjectId,
    string Title,
    string? Description,
    TaskItemStatus Status,
    TaskPriority Priority,
    Guid? AssigneeId,
    DateTimeOffset CreatedAt,
    DateTimeOffset? CompletedAt);

public sealed record CreateTaskRequest(Guid ProjectId, string Title, TaskPriority Priority, string? Description);

public sealed record AssignTaskRequest(Guid AssigneeId);
