using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Infrastructure.Persistence;

/// <summary>
/// The EF Core context — our concrete <see cref="IUnitOfWork"/> over PostgreSQL. A DbContext already
/// tracks changes in memory and commits them atomically in <c>SaveChangesAsync</c>, which is exactly
/// the contract <see cref="IUnitOfWork"/> promised — so we satisfy that interface with zero extra code
/// (we just declare we implement it). This is the moment the third Phase-2 "port" gets its plug.
/// </summary>
public sealed class TaskFlowDbContext : DbContext, IUnitOfWork
{
    public TaskFlowDbContext(DbContextOptions<TaskFlowDbContext> options) : base(options)
    {
    }

    // A DbSet<T> is a queryable, addable collection backed by a table. The property name doubles
    // as the default table name — but we set table names explicitly in the configurations below.
    public DbSet<User> Users => Set<User>();
    public DbSet<ExternalIdentity> ExternalIdentities => Set<ExternalIdentity>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();

    /// <summary>
    /// Every SaveChanges overload funnels through this one, so this is the single place where an
    /// optimistic-concurrency loss (the row's xmin changed since we read it — see the entity
    /// configurations) is translated from EF's <see cref="DbUpdateConcurrencyException"/> into the
    /// Application-owned <see cref="ConflictException"/>. Application code stays EF-free, and both
    /// delivery adapters already know the exception: REST maps it to 409, GraphQL to CONFLICT.
    /// </summary>
    public override async Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess,
        CancellationToken cancellationToken = default)
    {
        try
        {
            return await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
        }
        catch (DbUpdateConcurrencyException exception)
        {
            // Entries is IReadOnlyList, so index it directly rather than going through LINQ (CA1826).
            var entity = exception.Entries.Count > 0
                ? exception.Entries[0].Metadata.ClrType.Name
                : "resource";
            throw new ConflictException(
                $"The {entity} was changed by another request since it was loaded. Reload it and retry.");
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Pick up every IEntityTypeConfiguration<T> in this assembly (one class per entity) instead
        // of cramming all mapping into this one method. SRP applied to persistence configuration.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TaskFlowDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
