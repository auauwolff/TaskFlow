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
/// fakes for these interfaces - see TaskFlow.Application.Tests.
/// </summary>
public sealed class UserService : IUserService
{
    private readonly IUserRepository _users;
    private readonly IExternalIdentityRepository _externalIdentities;
    private readonly IUnitOfWork _unitOfWork;

    public UserService(
        IUserRepository users,
        IExternalIdentityRepository externalIdentities,
        IUnitOfWork unitOfWork)
    {
        _users = users;
        _externalIdentities = externalIdentities;
        _unitOfWork = unitOfWork;
    }

    public async Task<UserDto> FindOrProvisionAsync(
        ExternalUserProfile profile,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(profile.Issuer) || string.IsNullOrWhiteSpace(profile.Subject))
            throw new ArgumentException("The external identity issuer and subject are required.");

        var identity = await _externalIdentities.GetAsync(
            profile.Issuer,
            profile.Subject,
            cancellationToken);

        if (identity is not null)
        {
            var existingUser = await _users.GetByIdAsync(identity.UserId, cancellationToken)
                ?? throw new NotFoundException(nameof(User), identity.UserId);

            var updatedEmail = Email.Create(profile.Email);
            var userWithEmail = await _users.GetByEmailAsync(updatedEmail, cancellationToken);
            if (userWithEmail is not null && userWithEmail.Id != existingUser.Id)
                throw new ConflictException($"A user with email '{updatedEmail}' already exists.");

            RefreshProfile(existingUser, profile.Name, updatedEmail);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return existingUser.ToDto();
        }

        var email = Email.Create(profile.Email);
        var user = await _users.GetByEmailAsync(email, cancellationToken);
        var isNewUser = user is null;

        if (user is not null && !profile.EmailVerified)
            throw new ConflictException(
                $"The existing user with email '{email}' requires a verified provider email before linking.");

        user ??= User.Create(profile.Name, email);
        RefreshProfile(user, profile.Name, email);

        var externalIdentity = ExternalIdentity.Create(
            user.Id,
            profile.Issuer,
            profile.Subject);

        if (isNewUser)
            await _users.AddAsync(user, cancellationToken);
        await _externalIdentities.AddAsync(externalIdentity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return user.ToDto();
    }

    private static void RefreshProfile(User user, string name, Email email)
    {
        user.Rename(name);
        user.ChangeEmail(email);
    }

    public async Task<UserDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await _users.GetByIdAsync(id, cancellationToken)
                   ?? throw new NotFoundException(nameof(User), id);

        return user.ToDto();
    }
}
