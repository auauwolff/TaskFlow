using TaskFlow.Domain.Entities;

namespace TaskFlow.Domain.Repositories;

/// <summary>
/// Persistence contract for <see cref="Project"/>. Notice the methods speak in domain terms
/// (ListByOwner), not database terms (no SQL, no IQueryable leaking out). The interface returns
/// <c>IReadOnlyList</c> so callers can't mutate the collection it hands back.
/// </summary>
public interface IProjectRepository
{
    Task<Project?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Project>> ListByOwnerAsync(Guid ownerId, CancellationToken cancellationToken = default);
    Task AddAsync(Project project, CancellationToken cancellationToken = default);
}
