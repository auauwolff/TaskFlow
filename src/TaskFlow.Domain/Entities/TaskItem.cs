using TaskFlow.Domain.Common;
using TaskFlow.Domain.Enums;
using TaskFlow.Domain.Exceptions;

namespace TaskFlow.Domain.Entities;

/// <summary>
/// A single unit of work inside a Project. This is the richest entity: its <see cref="Status"/>
/// follows a small <b>state machine</b>, and the only way to move between states is through
/// methods that guard the legal transitions (<see cref="Start"/>, <see cref="Complete"/>,
/// <see cref="Reopen"/>). There is no public Status setter, so external code physically cannot
/// put a task into an illegal state.
/// </summary>
public sealed class TaskItem : Entity
{
    public string Title { get; private set; }
    public string? Description { get; private set; }
    public TaskItemStatus Status { get; private set; }
    public TaskPriority Priority { get; private set; }
    public Guid ProjectId { get; private set; }
    public Guid? AssigneeId { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset? CompletedAt { get; private set; }

    private TaskItem(
        Guid id, Guid projectId, string title, string? description,
        TaskItemStatus status, TaskPriority priority, DateTimeOffset createdAt) : base(id)
    {
        ProjectId = projectId;
        Title = title;
        Description = description;
        Status = status;
        Priority = priority;
        CreatedAt = createdAt;
    }

    public static TaskItem Create(
        Guid projectId, string title,
        TaskPriority priority = TaskPriority.Medium, string? description = null)
    {
        if (projectId == Guid.Empty)
            throw new DomainException("A task must belong to a project.");
        if (string.IsNullOrWhiteSpace(title))
            throw new DomainException("Task title is required.");

        // A brand-new task always starts in Todo — the entity controls its own initial state.
        return new TaskItem(
            Guid.NewGuid(), projectId, title.Trim(), description,
            TaskItemStatus.Todo, priority, DateTimeOffset.UtcNow);
    }

    /// <summary>Move the task into progress. A finished task must be reopened first.</summary>
    public void Start()
    {
        if (Status == TaskItemStatus.Done)
            throw new DomainException("A completed task can't be started; reopen it first.");

        Status = TaskItemStatus.InProgress;
    }

    /// <summary>Mark the task done. Idempotent: completing an already-done task is a no-op.</summary>
    public void Complete()
    {
        if (Status == TaskItemStatus.Done)
            return;

        Status = TaskItemStatus.Done;
        CompletedAt = DateTimeOffset.UtcNow;
    }

    /// <summary>Send a completed task back to Todo, clearing its completion timestamp.</summary>
    public void Reopen()
    {
        if (Status != TaskItemStatus.Done)
            throw new DomainException("Only a completed task can be reopened.");

        Status = TaskItemStatus.Todo;
        CompletedAt = null;
    }

    public void AssignTo(Guid userId)
    {
        if (userId == Guid.Empty)
            throw new DomainException("Cannot assign a task to an empty user id.");

        AssigneeId = userId;
    }

    public void Unassign() => AssigneeId = null;

    public void ChangePriority(TaskPriority priority) => Priority = priority;
}
