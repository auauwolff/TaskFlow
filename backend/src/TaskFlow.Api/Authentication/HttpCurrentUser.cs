using TaskFlow.Application.Common.Interfaces;

namespace TaskFlow.Api.Authentication;

internal sealed class HttpCurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    public Guid UserId
    {
        get
        {
            var value = httpContextAccessor.HttpContext?.User.FindFirst(TaskFlowClaimTypes.UserId)?.Value;
            return Guid.TryParse(value, out var userId)
                ? userId
                : throw new UnauthorizedAccessException("The authenticated TaskFlow user is unavailable.");
        }
    }
}
