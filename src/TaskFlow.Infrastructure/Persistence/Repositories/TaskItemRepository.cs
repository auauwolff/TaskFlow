using Microsoft.EntityFrameworkCore;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Repositories;

namespace TaskFlow.Infrastructure.Persistence.Repositories;

internal sealed class TaskItemRepository : ITaskItemRepository
{
    private readonly TaskFlowDbContext _db;

    public TaskItemRepository(TaskFlowDbContext db) => _db = db;

    // Tracked: CompleteAsync / AssignAsync load via this method, mutate the entity, then save —
    // which only works if EF is tracking the instance it handed back.
    public Task<TaskItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _db.Tasks.FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

    public async Task<IReadOnlyList<TaskItem>> ListByProjectAsync(Guid projectId, CancellationToken cancellationToken = default) =>
        await _db.Tasks
            .AsNoTracking()
            .Where(t => t.ProjectId == projectId)
            .ToListAsync(cancellationToken);

    public async Task AddAsync(TaskItem task, CancellationToken cancellationToken = default) =>
        await _db.Tasks.AddAsync(task, cancellationToken);

    public void Remove(TaskItem task) => _db.Tasks.Remove(task);
}
