using FluentAssertions;
using FluentValidation;
using NSubstitute;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Tasks;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;
using TaskFlow.Domain.Repositories;
using TaskFlow.Domain.ValueObjects;

namespace TaskFlow.Application.Tests.Tasks;

public sealed class TaskServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 7, 18, 12, 0, 0, TimeSpan.Zero);
    private readonly Guid _ownerId = Guid.NewGuid();
    private readonly ITaskItemRepository _tasks = Substitute.For<ITaskItemRepository>();
    private readonly IProjectRepository _projects = Substitute.For<IProjectRepository>();
    private readonly IUserRepository _users = Substitute.For<IUserRepository>();
    private readonly ICurrentUser _currentUser = Substitute.For<ICurrentUser>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly TestTimeProvider _timeProvider = new(Now);
    private readonly TaskService _service;

    public TaskServiceTests()
    {
        _currentUser.UserId.Returns(_ownerId);
        _service = new TaskService(
            _tasks,
            _projects,
            _users,
            _currentUser,
            _unitOfWork,
            new CreateTaskRequestValidator(),
            new AssignTaskRequestValidator(),
            _timeProvider);
    }

    [Fact]
    public async Task CreateAsync_ValidRequest_VerifiesProjectAddsAndSaves()
    {
        var project = Project.Create("TaskFlow", _ownerId, _timeProvider);
        var request = new CreateTaskRequest(project.Id, "  Write tests  ", TaskPriority.High, "Cover the domain rules");
        TaskItem? addedTask = null;
        _projects.GetByIdAsync(project.Id, Arg.Any<CancellationToken>()).Returns(project);
        _tasks.AddAsync(Arg.Do<TaskItem>(task => addedTask = task), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        var result = await _service.CreateAsync(request);

        addedTask.Should().NotBeNull();
        result.Id.Should().Be(addedTask!.Id);
        result.Title.Should().Be("Write tests");
        result.Status.Should().Be(TaskItemStatus.Todo);
        result.Priority.Should().Be(TaskPriority.High);
        result.CreatedAt.Should().Be(Now);
        await _tasks.Received(1).AddAsync(addedTask, Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CreateAsync_InvalidRequest_DoesNotQueryOrSave()
    {
        var request = new CreateTaskRequest(Guid.Empty, "", (TaskPriority)999, null);

        var act = () => _service.CreateAsync(request);

        await act.Should().ThrowAsync<ValidationException>();
        await _projects.DidNotReceiveWithAnyArgs().GetByIdAsync(default, default);
        await _tasks.DidNotReceiveWithAnyArgs().AddAsync(default!, default);
        await _unitOfWork.DidNotReceiveWithAnyArgs().SaveChangesAsync(default);
    }

    [Fact]
    public async Task CreateAsync_MissingProject_ThrowsWithoutSaving()
    {
        var projectId = Guid.NewGuid();
        _projects.GetByIdAsync(projectId, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<Project?>(null));

        var act = () => _service.CreateAsync(
            new CreateTaskRequest(projectId, "Write tests", TaskPriority.Medium, null));

        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage($"Project with id '{projectId}' was not found.");
        await _tasks.DidNotReceiveWithAnyArgs().AddAsync(default!, default);
        await _unitOfWork.DidNotReceiveWithAnyArgs().SaveChangesAsync(default);
    }

    [Fact]
    public async Task CompleteAsync_ExistingTask_CompletesAndSavesTrackedEntity()
    {
        var (project, task) = CreateTask();
        _tasks.GetByIdAsync(task.Id, Arg.Any<CancellationToken>()).Returns(task);
        _projects.GetByIdAsync(project.Id, Arg.Any<CancellationToken>()).Returns(project);
        _timeProvider.UtcNow = Now.AddHours(1);

        var result = await _service.CompleteAsync(task.Id);

        task.Status.Should().Be(TaskItemStatus.Done);
        task.CompletedAt.Should().Be(_timeProvider.UtcNow);
        result.CompletedAt.Should().Be(_timeProvider.UtcNow);
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
        await _tasks.DidNotReceiveWithAnyArgs().AddAsync(default!, default);
    }

    [Fact]
    public async Task CompleteAsync_MissingTask_ThrowsWithoutSaving()
    {
        var id = Guid.NewGuid();
        _tasks.GetByIdAsync(id, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<TaskItem?>(null));

        var act = () => _service.CompleteAsync(id);

        await act.Should().ThrowAsync<NotFoundException>();
        await _unitOfWork.DidNotReceiveWithAnyArgs().SaveChangesAsync(default);
    }

    [Fact]
    public async Task AssignAsync_ValidRequest_AssignsAndSaves()
    {
        var (project, task) = CreateTask();
        var assignee = User.Create("Ada", Email.Create("ada@example.com"));
        _tasks.GetByIdAsync(task.Id, Arg.Any<CancellationToken>()).Returns(task);
        _projects.GetByIdAsync(project.Id, Arg.Any<CancellationToken>()).Returns(project);
        _users.GetByIdAsync(assignee.Id, Arg.Any<CancellationToken>()).Returns(assignee);

        var result = await _service.AssignAsync(task.Id, new AssignTaskRequest(assignee.Id));

        task.AssigneeId.Should().Be(assignee.Id);
        result.AssigneeId.Should().Be(assignee.Id);
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task AssignAsync_MissingTask_DoesNotQueryAssigneeOrSave()
    {
        var id = Guid.NewGuid();
        var assigneeId = Guid.NewGuid();
        _tasks.GetByIdAsync(id, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<TaskItem?>(null));

        var act = () => _service.AssignAsync(id, new AssignTaskRequest(assigneeId));

        await act.Should().ThrowAsync<NotFoundException>();
        await _users.DidNotReceiveWithAnyArgs().GetByIdAsync(default, default);
        await _unitOfWork.DidNotReceiveWithAnyArgs().SaveChangesAsync(default);
    }

    [Fact]
    public async Task AssignAsync_MissingAssignee_DoesNotMutateOrSave()
    {
        var (project, task) = CreateTask();
        var assigneeId = Guid.NewGuid();
        _tasks.GetByIdAsync(task.Id, Arg.Any<CancellationToken>()).Returns(task);
        _projects.GetByIdAsync(project.Id, Arg.Any<CancellationToken>()).Returns(project);
        _users.GetByIdAsync(assigneeId, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<User?>(null));

        var act = () => _service.AssignAsync(task.Id, new AssignTaskRequest(assigneeId));

        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage($"User with id '{assigneeId}' was not found.");
        task.AssigneeId.Should().BeNull();
        await _unitOfWork.DidNotReceiveWithAnyArgs().SaveChangesAsync(default);
    }

    [Fact]
    public async Task GetByIdAsync_TaskInAnotherUsersProject_ReturnsNotFound()
    {
        var project = Project.Create("Private", Guid.NewGuid(), _timeProvider);
        var task = TaskItem.Create(project.Id, "Secret", _timeProvider);
        _tasks.GetByIdAsync(task.Id, Arg.Any<CancellationToken>()).Returns(task);
        _projects.GetByIdAsync(project.Id, Arg.Any<CancellationToken>()).Returns(project);

        var act = () => _service.GetByIdAsync(task.Id);

        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage($"Project with id '{project.Id}' was not found.");
    }

    private (Project Project, TaskItem Task) CreateTask()
    {
        var project = Project.Create("TaskFlow", _ownerId, _timeProvider);
        return (project, TaskItem.Create(project.Id, "Write tests", _timeProvider));
    }
}
