using FluentAssertions;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Exceptions;

namespace TaskFlow.Domain.Tests.Entities;

public sealed class ProjectTests
{
    private static readonly DateTimeOffset Now = new(2026, 7, 18, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Create_ValidDetails_CreatesProjectAtProvidedTime()
    {
        var ownerId = Guid.NewGuid();

        var project = Project.Create("  TaskFlow  ", ownerId, new TestTimeProvider(Now), "Learn .NET");

        project.Id.Should().NotBeEmpty();
        project.Name.Should().Be("TaskFlow");
        project.Description.Should().Be("Learn .NET");
        project.OwnerId.Should().Be(ownerId);
        project.CreatedAt.Should().Be(Now);
    }

    [Fact]
    public void Create_MissingOwner_ThrowsDomainException()
    {
        var act = () => Project.Create("TaskFlow", Guid.Empty, new TestTimeProvider(Now));

        act.Should().Throw<DomainException>().WithMessage("A project must have an owner.");
    }

    [Fact]
    public void Rename_MissingName_LeavesExistingNameUnchanged()
    {
        var project = Project.Create("TaskFlow", Guid.NewGuid(), new TestTimeProvider(Now));

        var act = () => project.Rename(" ");

        act.Should().Throw<DomainException>();
        project.Name.Should().Be("TaskFlow");
    }

    [Fact]
    public void UpdateDescription_Null_ClearsDescription()
    {
        var project = Project.Create("TaskFlow", Guid.NewGuid(), new TestTimeProvider(Now), "Old");

        project.UpdateDescription(null);

        project.Description.Should().BeNull();
    }
}
