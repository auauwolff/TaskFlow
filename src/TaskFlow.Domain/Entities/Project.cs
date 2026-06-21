using TaskFlow.Domain.Common;
using TaskFlow.Domain.Exceptions;

namespace TaskFlow.Domain.Entities;

/// <summary>
/// A container of tasks, owned by a User. We reference the owner by <see cref="OwnerId"/> rather
/// than holding a whole <c>User</c> object, because Project and User are <i>separate aggregates</i>
/// — each loaded and saved on its own. Referencing other aggregates by id (not by object graph)
/// keeps the model loosely coupled and the database boundaries clean.
/// </summary>
public sealed class Project : Entity
{
    public string Name { get; private set; }
    public string? Description { get; private set; }
    public Guid OwnerId { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

    private Project(Guid id, string name, string? description, Guid ownerId, DateTimeOffset createdAt)
        : base(id)
    {
        Name = name;
        Description = description;
        OwnerId = ownerId;
        CreatedAt = createdAt;
    }

    public static Project Create(string name, Guid ownerId, string? description = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Project name is required.");
        if (ownerId == Guid.Empty)
            throw new DomainException("A project must have an owner.");

        // NOTE (testability): reading the clock here is a hidden dependency on "now" — it makes
        // time-based tests awkward. It's fine while learning; in Phase 5 we'll talk about
        // injecting .NET's TimeProvider so the clock becomes a controllable dependency.
        return new Project(Guid.NewGuid(), name.Trim(), description, ownerId, DateTimeOffset.UtcNow);
    }

    public void Rename(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Project name is required.");

        Name = name.Trim();
    }

    public void UpdateDescription(string? description) => Description = description;
}
