using FluentAssertions;
using NSubstitute;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Projects;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Repositories;
using TaskFlow.Domain.ValueObjects;

namespace TaskFlow.Application.Tests.Projects;

public sealed class ProjectServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 7, 18, 12, 0, 0, TimeSpan.Zero);
    private readonly IProjectRepository _projects = Substitute.For<IProjectRepository>();
    private readonly IUserRepository _users = Substitute.For<IUserRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly TestTimeProvider _timeProvider = new(Now);
    private readonly ProjectService _service;

    public ProjectServiceTests()
    {
        _service = new ProjectService(
            _projects,
            _users,
            _unitOfWork,
            new CreateProjectRequestValidator(),
            _timeProvider);
    }

    [Fact]
    public async Task CreateAsync_ValidRequest_VerifiesOwnerAddsAndSaves()
    {
        var owner = User.Create("Ada", Email.Create("ada@example.com"));
        var request = new CreateProjectRequest("  TaskFlow  ", owner.Id, "Learn testing");
        Project? addedProject = null;
        _users.GetByIdAsync(owner.Id, Arg.Any<CancellationToken>()).Returns(owner);
        _projects.AddAsync(Arg.Do<Project>(project => addedProject = project), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        var result = await _service.CreateAsync(request);

        addedProject.Should().NotBeNull();
        result.Should().Be(new ProjectDto(
            addedProject!.Id,
            "TaskFlow",
            request.Description,
            owner.Id,
            Now));
        await _users.Received(1).GetByIdAsync(owner.Id, Arg.Any<CancellationToken>());
        await _projects.Received(1).AddAsync(addedProject, Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CreateAsync_MissingOwner_ThrowsWithoutSaving()
    {
        var ownerId = Guid.NewGuid();
        _users.GetByIdAsync(ownerId, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<User?>(null));

        var act = () => _service.CreateAsync(new CreateProjectRequest("TaskFlow", ownerId, null));

        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage($"User with id '{ownerId}' was not found.");
        await _projects.DidNotReceiveWithAnyArgs().AddAsync(default!, default);
        await _unitOfWork.DidNotReceiveWithAnyArgs().SaveChangesAsync(default);
    }

    [Fact]
    public async Task ListByOwnerAsync_ProjectsExist_ReturnsMappedDtosInOrder()
    {
        var ownerId = Guid.NewGuid();
        IReadOnlyList<Project> projects =
        [
            Project.Create("First", ownerId, _timeProvider),
            Project.Create("Second", ownerId, _timeProvider, "Details")
        ];
        _projects.ListByOwnerAsync(ownerId, Arg.Any<CancellationToken>()).Returns(projects);

        var result = await _service.ListByOwnerAsync(ownerId);

        result.Select(project => project.Name).Should().ContainInOrder("First", "Second");
        result.Should().AllSatisfy(project => project.OwnerId.Should().Be(ownerId));
    }

    [Fact]
    public async Task GetByIdAsync_MissingProject_ThrowsNotFound()
    {
        var id = Guid.NewGuid();
        _projects.GetByIdAsync(id, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<Project?>(null));

        var act = () => _service.GetByIdAsync(id);

        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage($"Project with id '{id}' was not found.");
    }
}
