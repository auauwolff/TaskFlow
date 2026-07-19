using TaskFlow.Domain.Entities;

namespace TaskFlow.Domain.Repositories;

public interface IExternalIdentityRepository
{
    Task<ExternalIdentity?> GetAsync(
        string issuer,
        string subject,
        CancellationToken cancellationToken = default);

    Task AddAsync(ExternalIdentity identity, CancellationToken cancellationToken = default);
}
