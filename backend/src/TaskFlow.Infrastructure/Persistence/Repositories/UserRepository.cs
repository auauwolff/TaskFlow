using Microsoft.EntityFrameworkCore;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Repositories;
using TaskFlow.Domain.ValueObjects;

namespace TaskFlow.Infrastructure.Persistence.Repositories;

/// <summary>
/// The EF Core ADAPTER for the <see cref="IUserRepository"/> port the Domain declared. The Domain
/// owns the contract; this is the plug. Note it depends on the concrete <see cref="TaskFlowDbContext"/>
/// — that's allowed, because Infrastructure is the outermost layer; the dependency still points inward.
/// </summary>
internal sealed class UserRepository : IUserRepository
{
    private readonly TaskFlowDbContext _db;

    public UserRepository(TaskFlowDbContext db) => _db = db;

    public Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _db.Users.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

    public Task<User?> GetByEmailAsync(Email email, CancellationToken cancellationToken = default) =>
        _db.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);

    // AddAsync only STAGES the insert in the change-tracker; nothing hits Postgres until the
    // unit of work calls SaveChangesAsync. (That gap is the whole point of the Unit of Work pattern.)
    public async Task AddAsync(User user, CancellationToken cancellationToken = default) =>
        await _db.Users.AddAsync(user, cancellationToken);
}
