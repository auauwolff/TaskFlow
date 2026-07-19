namespace TaskFlow.Application.Users;

/// <summary>
/// What we send back to clients. A DTO (Data Transfer Object) is a flat, serializable view of
/// data — deliberately SEPARATE from the <c>User</c> entity. The entity has behavior, private
/// setters, and invariants to protect; the DTO is just data crossing the wire. Keeping them
/// apart means reshaping your API never forces a change to your domain model, and vice-versa.
/// (Records give us immutability + value equality + a tidy constructor for free.)
/// </summary>
public sealed record UserDto(Guid Id, string Name, string Email);

/// <summary>Provider-neutral profile supplied only by the trusted OIDC authentication adapter.</summary>
public sealed record ExternalUserProfile(
    string Issuer,
    string Subject,
    string Name,
    string Email,
    bool EmailVerified);
