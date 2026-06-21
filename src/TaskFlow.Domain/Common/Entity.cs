namespace TaskFlow.Domain.Common;

/// <summary>
/// Base class for <b>entities</b> — domain objects defined by a continuous <i>identity</i>
/// rather than by their current attribute values. A user is still "the same user" after you
/// rename them: it's the <see cref="Id"/> that makes them the same, not their data.
/// (Contrast with <c>ValueObject</c>, which is equal by value.)
/// </summary>
public abstract class Entity
{
    // 'protected set' = the value can only be set by this class or subclasses, never from outside.
    public Guid Id { get; protected set; }

    protected Entity(Guid id) => Id = id;

    // Two entities of the same type are equal when their identities match — regardless of
    // whether their other fields differ.
    public override bool Equals(object? obj) =>
        obj is Entity other && GetType() == other.GetType() && Id == other.Id;

    public override int GetHashCode() => Id.GetHashCode();
}
