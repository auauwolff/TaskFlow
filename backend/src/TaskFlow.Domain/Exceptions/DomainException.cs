namespace TaskFlow.Domain.Exceptions;

/// <summary>
/// Thrown when a domain rule (an invariant) is violated. Because it lives in the Domain layer,
/// the core can shout "this isn't allowed" without knowing anything about HTTP status codes or
/// databases. The Api layer (Phase 4) will translate these into 400/422 responses — the domain
/// stays blissfully unaware of the web.
/// </summary>
public class DomainException : Exception
{
    public DomainException(string message) : base(message) { }
}
