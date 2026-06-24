namespace TaskFlow.Application.Common.Interfaces;

/// <summary>
/// The transaction boundary for a use case. Repositories stage entities (Add/Remove) in memory;
/// this commits them all in one atomic <c>SaveChanges</c>. It lives in Application — not Domain —
/// because "when do we commit a unit of work" is an orchestration concern, not a business rule.
/// Implemented by the EF Core <c>DbContext</c> wrapper in Infrastructure (Phase 3).
/// </summary>
public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
