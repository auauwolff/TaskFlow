namespace TaskFlow.Application.Common.Exceptions;

/// <summary>
/// Thrown when a use case needs the authenticated TaskFlow identity and it is unavailable.
/// <para>
/// This exists rather than reusing <see cref="UnauthorizedAccessException"/> because that BCL type
/// is thrown by the file system and other framework code for unrelated reasons. Mapping it globally
/// to 401 would silently reclassify an IO failure as an authentication problem; mapping a type this
/// application owns cannot.
/// </para>
/// <para>
/// It is normally unreachable: the authorization fallback policy rejects anonymous requests before
/// a use case runs. It is mapped anyway, because "unreachable" and "unmapped" are different claims,
/// and the second one produces a 500.
/// </para>
/// </summary>
public sealed class UnauthenticatedException : Exception
{
    public UnauthenticatedException(string message) : base(message) { }
}
