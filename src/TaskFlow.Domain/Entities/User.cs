using TaskFlow.Domain.Common;
using TaskFlow.Domain.Exceptions;
using TaskFlow.Domain.ValueObjects;

namespace TaskFlow.Domain.Entities;

/// <summary>
/// A person who owns projects and gets assigned tasks. Notice every property has a <b>private
/// setter</b>: you change a User only through intention-revealing methods (<see cref="Rename"/>,
/// <see cref="ChangeEmail"/>), never by poking fields from outside. That's encapsulation — and
/// it's what makes this a <i>rich</i> domain model instead of an <i>anemic</i> bag of public setters.
/// </summary>
public sealed class User : Entity
{
    public string Name { get; private set; }
    public Email Email { get; private set; }

    private User(Guid id, string name, Email email) : base(id)
    {
        Name = name;
        Email = email;
    }

    /// <summary>The one true way to create a User. Guarantees a valid object or throws.</summary>
    public static User Create(string name, Email email)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("User name is required.");

        return new User(Guid.NewGuid(), name.Trim(), email);
    }

    public void Rename(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("User name is required.");

        Name = name.Trim();
    }

    public void ChangeEmail(Email email) => Email = email;
}
