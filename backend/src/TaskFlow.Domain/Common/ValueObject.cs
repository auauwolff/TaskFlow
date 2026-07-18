namespace TaskFlow.Domain.Common;

/// <summary>
/// Base class for <b>value objects</b> — domain objects with no identity, defined entirely by
/// their values. Two value objects are equal when all their components are equal, the same way
/// two $10 notes are interchangeable. Value objects should be immutable and validate themselves
/// on creation, so an invalid value can never exist.
/// </summary>
public abstract class ValueObject
{
    /// <summary>The values that together define equality for this object.</summary>
    protected abstract IEnumerable<object?> GetEqualityComponents();

    public override bool Equals(object? obj)
    {
        if (obj is null || obj.GetType() != GetType())
            return false;

        var other = (ValueObject)obj;
        return GetEqualityComponents().SequenceEqual(other.GetEqualityComponents());
    }

    public override int GetHashCode() =>
        GetEqualityComponents()
            .Aggregate(0, (hash, component) => HashCode.Combine(hash, component));

    public static bool operator ==(ValueObject? left, ValueObject? right) => Equals(left, right);
    public static bool operator !=(ValueObject? left, ValueObject? right) => !Equals(left, right);
}
