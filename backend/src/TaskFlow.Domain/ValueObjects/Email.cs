using TaskFlow.Domain.Common;
using TaskFlow.Domain.Exceptions;

namespace TaskFlow.Domain.ValueObjects;

/// <summary>
/// An email address modelled as a value object. You cannot create an invalid one: the only way
/// to make an Email is the <see cref="Create"/> factory, which validates first. So anywhere the
/// codebase holds an <c>Email</c>, it is guaranteed to be valid — no defensive re-checking needed.
/// This is the "make illegal states unrepresentable" idea in practice.
/// </summary>
public sealed class Email : ValueObject
{
    public string Value { get; }

    // Private constructor: callers MUST go through Create, so validation can't be skipped.
    private Email(string value) => Value = value;

    public static Email Create(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException("Email cannot be empty.");

        // One canonical representation keeps Domain equality, repository lookups and the
        // database's unique text index consistent.
        value = value.Trim().ToLowerInvariant();

        // Deliberately minimal — exactly one '@', not at the very start or end. Heavier,
        // user-facing validation belongs in the Application layer's validators (Phase 2).
        var at = value.IndexOf('@');
        if (at <= 0 || at != value.LastIndexOf('@') || at == value.Length - 1)
            throw new DomainException($"'{value}' is not a valid email address.");

        return new Email(value);
    }

    // Equality is case-insensitive: Bob@x.com and bob@x.com represent the same address.
    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Value.ToLowerInvariant();
    }

    public override string ToString() => Value;
}
