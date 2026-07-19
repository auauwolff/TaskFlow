namespace TaskFlow.Application.Common.Interfaces;

/// <summary>
/// The authenticated TaskFlow identity. The Application layer owns this port and the HTTP adapter
/// resolves it from the validated authentication cookie.
/// </summary>
public interface ICurrentUser
{
    Guid UserId { get; }
}
