using FluentAssertions;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Exceptions;
using TaskFlow.Domain.ValueObjects;

namespace TaskFlow.Domain.Tests.Entities;

public sealed class UserTests
{
    [Fact]
    public void Create_ValidDetails_CreatesUser()
    {
        var email = Email.Create("ada@example.com");

        var user = User.Create("  Ada Lovelace  ", email);

        user.Id.Should().NotBeEmpty();
        user.Name.Should().Be("Ada Lovelace");
        user.Email.Should().BeSameAs(email);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_MissingName_ThrowsDomainException(string name)
    {
        var act = () => User.Create(name, Email.Create("ada@example.com"));

        act.Should().Throw<DomainException>().WithMessage("User name is required.");
    }

    [Fact]
    public void Rename_ValidName_ChangesNameWithoutChangingIdentity()
    {
        var user = User.Create("Ada", Email.Create("ada@example.com"));
        var id = user.Id;

        user.Rename("  Augusta Ada  ");

        user.Name.Should().Be("Augusta Ada");
        user.Id.Should().Be(id);
    }

    [Fact]
    public void Rename_MissingName_LeavesExistingNameUnchanged()
    {
        var user = User.Create("Ada", Email.Create("ada@example.com"));

        var act = () => user.Rename(" ");

        act.Should().Throw<DomainException>();
        user.Name.Should().Be("Ada");
    }
}
