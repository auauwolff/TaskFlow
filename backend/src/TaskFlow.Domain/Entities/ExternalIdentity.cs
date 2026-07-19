using TaskFlow.Domain.Common;
using TaskFlow.Domain.Exceptions;

namespace TaskFlow.Domain.Entities;

/// <summary>
/// Links a provider-neutral OpenID Connect identity to TaskFlow's own user identity. The issuer and
/// subject are the stable OIDC identity key; email is profile data and must never be used instead.
/// </summary>
public sealed class ExternalIdentity : Entity
{
    public Guid UserId { get; private set; }
    public string Issuer { get; private set; }
    public string Subject { get; private set; }

    private ExternalIdentity(Guid id, Guid userId, string issuer, string subject) : base(id)
    {
        UserId = userId;
        Issuer = issuer;
        Subject = subject;
    }

    public static ExternalIdentity Create(Guid userId, string issuer, string subject)
    {
        if (userId == Guid.Empty)
            throw new DomainException("An external identity must belong to a user.");
        if (string.IsNullOrWhiteSpace(issuer))
            throw new DomainException("An external identity issuer is required.");
        if (string.IsNullOrWhiteSpace(subject))
            throw new DomainException("An external identity subject is required.");
        if (issuer.Trim().Length > 500)
            throw new DomainException("An external identity issuer cannot exceed 500 characters.");
        if (subject.Trim().Length > 500)
            throw new DomainException("An external identity subject cannot exceed 500 characters.");

        return new ExternalIdentity(Guid.NewGuid(), userId, issuer.Trim(), subject.Trim());
    }
}
