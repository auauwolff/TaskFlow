namespace TaskFlow.Application.Users;

/// <summary>
/// The use cases available for users — each method is one use case. The Api and the tests depend
/// on this interface, not on the concrete <c>UserService</c>; the DI container supplies the
/// implementation. (This is the consumer side of Dependency Injection.)
/// </summary>
public interface IUserService
{
    Task<UserDto> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken = default);
    Task<UserDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
}
