using FluentValidation;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Repositories;
using TaskFlow.Domain.ValueObjects;

namespace TaskFlow.Application.Users;

/// <summary>
/// Orchestrates the user use cases. Look at the constructor: every dependency is an INTERFACE,
/// handed in by the DI container. This class never calls <c>new</c> on a repository or a
/// DbContext — it has no idea EF Core or Postgres exist. That's Dependency Injection and the
/// Dependency Inversion Principle working together. The class is also trivially testable: pass
/// fakes for these interfaces (Phase 5).
/// </summary>
public sealed class UserService : IUserService
{
    private readonly IUserRepository _users;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IValidator<CreateUserRequest> _validator;

    public UserService(
        IUserRepository users,
        IUnitOfWork unitOfWork,
        IValidator<CreateUserRequest> validator)
    {
        _users = users;
        _unitOfWork = unitOfWork;
        _validator = validator;
    }

    public async Task<UserDto> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken = default)
    {
        // 1. Validate the SHAPE of the input (an Application concern). Throws on failure.
        await _validator.ValidateAndThrowAsync(request, cancellationToken);

        // 2. Enforce a rule a single entity can't: email must be unique across ALL users.
        var email = Email.Create(request.Email);
        if (await _users.ExistsByEmailAsync(email, cancellationToken))
            throw new ConflictException($"A user with email '{email}' already exists.");

        // 3. Let the DOMAIN build a valid entity (business invariants live there, not here).
        var user = User.Create(request.Name, email);

        // 4. Persist: the repository stages the insert, the unit of work commits the transaction.
        await _users.AddAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 5. Return a DTO — never leak the entity itself out of the application boundary.
        return user.ToDto();
    }

    public async Task<UserDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await _users.GetByIdAsync(id, cancellationToken)
                   ?? throw new NotFoundException(nameof(User), id);

        return user.ToDto();
    }
}
