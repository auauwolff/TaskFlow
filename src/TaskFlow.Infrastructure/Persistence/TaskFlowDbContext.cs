using Microsoft.EntityFrameworkCore;
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
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Pick up every IEntityTypeConfiguration<T> in this assembly (one class per entity) instead
        // of cramming all mapping into this one method. SRP applied to persistence configuration.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TaskFlowDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
