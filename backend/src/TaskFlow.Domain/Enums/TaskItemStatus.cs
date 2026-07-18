namespace TaskFlow.Domain.Enums;

/// <summary>
/// The lifecycle state of a task. Named <c>TaskItemStatus</c> (not <c>TaskStatus</c>) on purpose,
/// to avoid colliding with <c>System.Threading.Tasks.TaskStatus</c>. The <i>allowed transitions</i>
/// between these states are enforced by methods on the TaskItem entity, not here.
/// </summary>
public enum TaskItemStatus
{
    Todo = 0,
    InProgress = 1,
    Done = 2
}
