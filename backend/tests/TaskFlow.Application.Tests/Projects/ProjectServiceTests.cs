using FluentAssertions;
using NSubstitute;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Projects;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Repositories;

namespace TaskFlow.Application.Tests.Projects;

public sealed class ProjectServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 7, 18, 12, 0, 0, TimeSpan.Zero);
    private readonly Guid _userId = Guid.NewGuid();
    private readonly IProjectRepository _projects = Substitute.For<IProjectRepository>();
    private readonly ICurrentUser _currentUser = Substitute.For<ICurrentUser>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly TestTimeProvider _timeProvider = new(Now);
    private readonly ProjectService _service;

    public ProjectServiceTests()
    {
        _currentUser.UserId.Returns(_userId);
        _service = new ProjectService(
            _projects,
            _currentUser,
            _unitOfWork,
            new CreateProjectRequestValidator(),
            _timeProvider);
    }

    [Fact]
    public async Task CreateAsync_ValidRequest_DerivesOwnerFromCurrentUser()
    {
        var request = new CreateProjectRequest("  TaskFlow  ", "Learn testing");
        Project? addedProject = null;
        _projects.AddAsync(Arg.Do<Project>(project => addedProject = project), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        var result = await _service.CreateAsync(request);

        addedProject.Should().NotBeNull();
        result.Should().Be(new ProjectDto(
            addedProject!.Id,
            "TaskFlow",
            request.Description,
            _userId,
            Now));
        await _projects.Received(1).AddAsync(addedProject, Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetByIdAsync_ProjectOwnedByAnotherUser_ReturnsNotFound()
    {
        var project = Project.Create("Private", Guid.NewGuid(), _timeProvider);
        _projects.GetByIdAsync(project.Id, Arg.Any<CancellationToken>()).Returns(project);

        var act = () => _service.GetByIdAsync(project.Id);

        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage($"Project with id '{project.Id}' was not found.");
    }

    [Fact]
    public async Task ListAsync_ProjectsExist_UsesAuthenticatedOwner()
    {
        IReadOnlyList<Project> projects =
        [
            Project.Create("First", _userId, _timeProvider),
            Project.Create("Second", _userId, _timeProvider, "Details")
        ];
        _projects.ListByOwnerAsync(_userId, Arg.Any<CancellationToken>()).Returns(projects);

        var result = await _service.ListAsync();

        result.Select(project => project.Name).Should().ContainInOrder("First", "Second");
        result.Should().AllSatisfy(project => project.OwnerId.Should().Be(_userId));
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
