using FluentAssertions;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Exceptions;

namespace TaskFlow.Domain.Tests.Entities;

public sealed class ExternalIdentityTests
{
    [Fact]
    public void Create_ValidOidcIdentity_LinksItToInternalUser()
    {
        var userId = Guid.NewGuid();

        var identity = ExternalIdentity.Create(
            userId,
            " https://identity.example ",
            " subject-123 ");

        identity.Id.Should().NotBeEmpty();
        identity.UserId.Should().Be(userId);
        identity.Issuer.Should().Be("https://identity.example");
        identity.Subject.Should().Be("subject-123");
    }

    [Theory]
    [InlineData("", "subject", "An external identity issuer is required.")]
    [InlineData("issuer", "", "An external identity subject is required.")]
    public void Create_MissingStableIdentityPart_ThrowsDomainException(
        string issuer,
        string subject,
        string message)
    {
        var act = () => ExternalIdentity.Create(Guid.NewGuid(), issuer, subject);

        act.Should().Throw<DomainException>().WithMessage(message);
    }
}
