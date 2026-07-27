using Microsoft.EntityFrameworkCore;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Repositories;

namespace TaskFlow.Infrastructure.Persistence.Repositories;

internal sealed class ProjectRepository : IProjectRepository
{
    private readonly TaskFlowDbContext _db;

    public ProjectRepository(TaskFlowDbContext db) => _db = db;

    // No AsNoTracking here: a caller might load a project and then mutate + save it, so EF needs
    // to keep tracking it for change detection.
    public Task<Project?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _db.Projects.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

    // AsNoTracking: this list is only ever mapped to DTOs and returned — read-only. Skipping change
    // tracking is a small, safe performance win for pure reads.
    public async Task<IReadOnlyList<Project>> ListByOwnerAsync(Guid ownerId, CancellationToken cancellationToken = default) =>
        await _db.Projects
            .AsNoTracking()
            .Where(p => p.OwnerId == ownerId)
            .ToListAsync(cancellationToken);

    public async Task AddAsync(Project project, CancellationToken cancellationToken = default) =>
        await _db.Projects.AddAsync(project, cancellationToken);
}
