using TaskFlow.Domain.Entities;
using TaskFlow.Domain.ValueObjects;

namespace TaskFlow.Domain.Repositories;

/// <summary>
/// A "port": the Domain <i>declares</i> the persistence it needs as an interface, without caring
/// how it is implemented. The concrete EF Core implementation lives in the Infrastructure layer.
/// This is the <b>Dependency Inversion Principle</b>: the inner layer owns the
/// abstraction, and the outer layer is forced to depend on it — not the other way round.
/// </summary>
public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<User?> GetByEmailAsync(Email email, CancellationToken cancellationToken = default);
    Task AddAsync(User user, CancellationToken cancellationToken = default);
}
