using FluentAssertions;
using FluentValidation;
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
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly UserService _service;

    public UserServiceTests()
    {
        _service = new UserService(_users, _unitOfWork, new CreateUserRequestValidator());
    }

    [Fact]
    public async Task CreateAsync_ValidRequest_AddsUserSavesAndReturnsDto()
    {
        var request = new CreateUserRequest("  Ada Lovelace  ", "ADA@Example.COM");
        User? addedUser = null;
        _users.ExistsByEmailAsync(Arg.Any<Email>(), Arg.Any<CancellationToken>()).Returns(false);
        _users.AddAsync(Arg.Do<User>(user => addedUser = user), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        var result = await _service.CreateAsync(request);

        addedUser.Should().NotBeNull();
        addedUser!.Name.Should().Be("Ada Lovelace");
        addedUser.Email.Value.Should().Be("ada@example.com");
        result.Should().Be(new UserDto(addedUser.Id, addedUser.Name, addedUser.Email.Value));
        await _users.Received(1).AddAsync(addedUser, Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CreateAsync_InvalidRequest_DoesNotUsePersistence()
    {
        var act = () => _service.CreateAsync(new CreateUserRequest("", "not-an-email"));

        await act.Should().ThrowAsync<ValidationException>();
        await _users.DidNotReceiveWithAnyArgs().ExistsByEmailAsync(default!, default);
        await _users.DidNotReceiveWithAnyArgs().AddAsync(default!, default);
        await _unitOfWork.DidNotReceiveWithAnyArgs().SaveChangesAsync(default);
    }

    [Fact]
    public async Task CreateAsync_DuplicateEmail_ThrowsConflictWithoutSaving()
    {
        _users.ExistsByEmailAsync(
                Arg.Is<Email>(email => email != null && email.Value == "ada@example.com"),
                Arg.Any<CancellationToken>())
            .Returns(true);

        var act = () => _service.CreateAsync(new CreateUserRequest("Ada", "ADA@example.com"));

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("A user with email 'ada@example.com' already exists.");
        await _users.DidNotReceiveWithAnyArgs().AddAsync(default!, default);
        await _unitOfWork.DidNotReceiveWithAnyArgs().SaveChangesAsync(default);
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
