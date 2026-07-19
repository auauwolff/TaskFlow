using Microsoft.EntityFrameworkCore;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Repositories;

namespace TaskFlow.Infrastructure.Persistence.Repositories;

internal sealed class ExternalIdentityRepository(TaskFlowDbContext db) : IExternalIdentityRepository
{
    public Task<ExternalIdentity?> GetAsync(
        string issuer,
        string subject,
        CancellationToken cancellationToken = default) =>
        db.ExternalIdentities.FirstOrDefaultAsync(
            identity => identity.Issuer == issuer && identity.Subject == subject,
            cancellationToken);

    public async Task AddAsync(
        ExternalIdentity identity,
        CancellationToken cancellationToken = default) =>
        await db.ExternalIdentities.AddAsync(identity, cancellationToken);
}
