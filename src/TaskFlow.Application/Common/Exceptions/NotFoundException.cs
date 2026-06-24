namespace TaskFlow.Application.Common.Exceptions;

/// <summary>
/// Thrown when a use case needs an entity that doesn't exist (e.g. fetch a project by an id that
/// isn't there). This is an <i>application</i> failure, not a domain-rule violation, so it lives
/// here rather than in Domain. The Api maps it to HTTP 404 (Phase 4).
/// </summary>
public sealed class NotFoundException : Exception
{
    public NotFoundException(string entity, object key)
        : base($"{entity} with id '{key}' was not found.") { }
}
