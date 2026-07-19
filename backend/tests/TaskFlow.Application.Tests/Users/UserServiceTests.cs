using FluentAssertions;
using NSubstitute;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Users;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Repositories;
using TaskFlow.Domain.ValueObjects;

namespace TaskFlow.Application.Tests.Users;

public sealed class UserServiceTests
{
    private readonly IUserRepository _users = Substitute.For<IUserRepository>();
    private readonly IExternalIdentityRepository _externalIdentities =
        Substitute.For<IExternalIdentityRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly UserService _service;

    public UserServiceTests()
    {
        _service = new UserService(_users, _externalIdentities, _unitOfWork);
    }

    [Fact]
    public async Task FindOrProvisionAsync_NewIdentity_CreatesInternalUserAndLink()
    {
        var profile = new ExternalUserProfile(
            "https://identity.example",
            "subject-123",
            "  Ada Lovelace  ",
            "ADA@Example.COM",
            true);
        User? addedUser = null;
        ExternalIdentity? addedIdentity = null;
        _users.AddAsync(Arg.Do<User>(user => addedUser = user), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
        _externalIdentities.AddAsync(
                Arg.Do<ExternalIdentity>(identity => addedIdentity = identity),
                Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        var result = await _service.FindOrProvisionAsync(profile);

        addedUser.Should().NotBeNull();
        addedIdentity.Should().NotBeNull();
        addedIdentity!.UserId.Should().Be(addedUser!.Id);
        addedIdentity.Issuer.Should().Be(profile.Issuer);
        addedIdentity.Subject.Should().Be(profile.Subject);
        result.Should().Be(new UserDto(addedUser.Id, "Ada Lovelace", "ada@example.com"));
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task FindOrProvisionAsync_KnownIdentity_ReturnsSameUserAndRefreshesProfile()
    {
        var user = User.Create("Old name", Email.Create("old@example.com"));
        var identity = ExternalIdentity.Create(
            user.Id,
            "https://identity.example",
            "subject-123");
        var profile = new ExternalUserProfile(
            identity.Issuer,
            identity.Subject,
            "Ada Lovelace",
            "ada@example.com",
            true);
        _externalIdentities.GetAsync(identity.Issuer, identity.Subject, Arg.Any<CancellationToken>())
            .Returns(identity);
        _users.GetByIdAsync(user.Id, Arg.Any<CancellationToken>()).Returns(user);

        var result = await _service.FindOrProvisionAsync(profile);

        result.Id.Should().Be(user.Id);
        result.Name.Should().Be(profile.Name);
        result.Email.Should().Be(profile.Email);
        await _users.DidNotReceiveWithAnyArgs().AddAsync(default!, default);
        await _externalIdentities.DidNotReceiveWithAnyArgs().AddAsync(default!, default);
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task FindOrProvisionAsync_UnlinkedDuplicateEmail_ThrowsConflict()
    {
        var existingUser = User.Create("Ada", Email.Create("ada@example.com"));
        _users.GetByEmailAsync(
                Arg.Is<Email>(email => email != null && email.Value == "ada@example.com"),
                Arg.Any<CancellationToken>())
            .Returns(existingUser);

        var act = () => _service.FindOrProvisionAsync(new ExternalUserProfile(
            "https://identity.example",
            "new-subject",
            "Ada",
            "ada@example.com",
            false));

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage(
                "The existing user with email 'ada@example.com' requires a verified provider email before linking.");
        await _users.DidNotReceiveWithAnyArgs().AddAsync(default!, default);
        await _unitOfWork.DidNotReceiveWithAnyArgs().SaveChangesAsync(default);
    }

    [Fact]
    public async Task FindOrProvisionAsync_VerifiedEmailForExistingUser_LinksWithoutReplacingUser()
    {
        var existingUser = User.Create("Ada", Email.Create("ada@example.com"));
        _users.GetByEmailAsync(Arg.Any<Email>(), Arg.Any<CancellationToken>())
            .Returns(existingUser);
        ExternalIdentity? addedIdentity = null;
        _externalIdentities.AddAsync(
                Arg.Do<ExternalIdentity>(identity => addedIdentity = identity),
                Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        var result = await _service.FindOrProvisionAsync(new ExternalUserProfile(
            "https://identity.example",
            "subject-123",
            "Ada Lovelace",
            "ada@example.com",
            true));

        result.Id.Should().Be(existingUser.Id);
        addedIdentity!.UserId.Should().Be(existingUser.Id);
        await _users.DidNotReceiveWithAnyArgs().AddAsync(default!, default);
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetByIdAsync_MissingUser_ThrowsNotFound()
    {
        var id = Guid.NewGuid();
        _users.GetByIdAsync(id, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<User?>(null));

        var act = () => _service.GetByIdAsync(id);

        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage($"User with id '{id}' was not found.");
    }
}
