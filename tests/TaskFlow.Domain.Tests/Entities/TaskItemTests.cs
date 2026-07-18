using FluentAssertions;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;
using TaskFlow.Domain.Exceptions;

namespace TaskFlow.Domain.Tests.Entities;

public sealed class TaskItemTests
{
    private static readonly DateTimeOffset CreatedAt = new(2026, 7, 18, 12, 0, 0, TimeSpan.Zero);
    private readonly TestTimeProvider _timeProvider = new(CreatedAt);

    [Fact]
    public void Create_ValidDetails_StartsInTodoAtProvidedTime()
    {
        var projectId = Guid.NewGuid();

        var task = TaskItem.Create(projectId, "  Write tests  ", _timeProvider, TaskPriority.High, "Phase 5");

        task.Id.Should().NotBeEmpty();
        task.ProjectId.Should().Be(projectId);
        task.Title.Should().Be("Write tests");
        task.Description.Should().Be("Phase 5");
        task.Priority.Should().Be(TaskPriority.High);
        task.Status.Should().Be(TaskItemStatus.Todo);
        task.CreatedAt.Should().Be(CreatedAt);
        task.AssigneeId.Should().BeNull();
        task.CompletedAt.Should().BeNull();
    }

    [Fact]
    public void Start_TodoTask_MovesToInProgress()
    {
        var task = CreateTask();

        task.Start();

        task.Status.Should().Be(TaskItemStatus.InProgress);
    }

    [Fact]
    public void Complete_InProgressTask_MovesToDoneAtProvidedTime()
    {
        var task = CreateTask();
        task.Start();
        _timeProvider.UtcNow = CreatedAt.AddHours(2);

        task.Complete(_timeProvider);

        task.Status.Should().Be(TaskItemStatus.Done);
        task.CompletedAt.Should().Be(_timeProvider.UtcNow);
    }

    [Fact]
    public void Complete_AlreadyDone_DoesNotReplaceCompletionTime()
    {
        var task = CreateTask();
        task.Complete(_timeProvider);
        var firstCompletion = task.CompletedAt;
        _timeProvider.UtcNow = CreatedAt.AddDays(1);

        task.Complete(_timeProvider);

        task.CompletedAt.Should().Be(firstCompletion);
    }

    [Fact]
    public void Start_CompletedTask_ThrowsAndPreservesState()
    {
        var task = CreateTask();
        task.Complete(_timeProvider);

        var act = task.Start;

        act.Should().Throw<DomainException>();
        task.Status.Should().Be(TaskItemStatus.Done);
        task.CompletedAt.Should().Be(CreatedAt);
    }

    [Fact]
    public void Reopen_CompletedTask_ReturnsToTodoAndClearsCompletionTime()
    {
        var task = CreateTask();
        task.Complete(_timeProvider);

        task.Reopen();

        task.Status.Should().Be(TaskItemStatus.Todo);
        task.CompletedAt.Should().BeNull();
    }

    [Fact]
    public void Reopen_IncompleteTask_ThrowsAndPreservesState()
    {
        var task = CreateTask();

        var act = task.Reopen;

        act.Should().Throw<DomainException>();
        task.Status.Should().Be(TaskItemStatus.Todo);
    }

    [Fact]
    public void AssignAndUnassign_ValidUser_UpdatesAssignee()
    {
        var task = CreateTask();
        var userId = Guid.NewGuid();

        task.AssignTo(userId);
        task.AssigneeId.Should().Be(userId);

        task.Unassign();
        task.AssigneeId.Should().BeNull();
    }

    [Fact]
    public void AssignTo_EmptyUserId_ThrowsAndPreservesAssignee()
    {
        var task = CreateTask();
        var userId = Guid.NewGuid();
        task.AssignTo(userId);

        var act = () => task.AssignTo(Guid.Empty);

        act.Should().Throw<DomainException>();
        task.AssigneeId.Should().Be(userId);
    }

    private TaskItem CreateTask() =>
        TaskItem.Create(Guid.NewGuid(), "Write tests", _timeProvider);
}
