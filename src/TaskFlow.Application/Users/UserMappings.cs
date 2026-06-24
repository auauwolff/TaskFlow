using TaskFlow.Domain.Entities;

namespace TaskFlow.Application.Users;

/// <summary>
/// Hand-written mapping from the <c>User</c> entity to its DTO. We do this manually (no AutoMapper)
/// on purpose: it's explicit, debuggable, and trivial to read. Mapping libraries save typing on
/// large projects but hide behavior — a fair trade we can revisit as an optional upgrade later.
/// </summary>
internal static class UserMappings
{
    public static UserDto ToDto(this User user) =>
        new(user.Id, user.Name, user.Email.Value);
}
