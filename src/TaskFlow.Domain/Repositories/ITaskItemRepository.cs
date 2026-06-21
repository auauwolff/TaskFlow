using TaskFlow.Domain.Entities;

namespace TaskFlow.Domain.Repositories;

/// <summary>
/// Persistence contract for <see cref="TaskItem"/>. Each aggregate root (User, Project, TaskItem)
/// gets its own repository — a focused interface rather than one giant "IRepository" with dozens
/// of methods. That keeps each contract small and relevant (Interface Segregation Principle).
/// </summary>
public interface ITaskItemRepository
{
    Task<TaskItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TaskItem>> ListByProjectAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task AddAsync(TaskItem task, CancellationToken cancellationToken = default);
    void Remove(TaskItem task);
}
