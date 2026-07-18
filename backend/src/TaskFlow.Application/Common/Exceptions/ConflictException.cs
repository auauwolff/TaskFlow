namespace TaskFlow.Application.Common.Exceptions;

/// <summary>
/// Thrown when a request conflicts with current state (e.g. registering an email that's already
/// taken). Uniqueness is a rule about the <i>whole set</i> of users, which a single entity can't
/// enforce on its own — so it's checked in the Application layer. The Api maps this to HTTP 409.
/// </summary>
public sealed class ConflictException : Exception
{
    public ConflictException(string message) : base(message) { }
}
