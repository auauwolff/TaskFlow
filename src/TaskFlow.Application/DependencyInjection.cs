using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using TaskFlow.Application.Projects;
using TaskFlow.Application.Tasks;
using TaskFlow.Application.Users;

namespace TaskFlow.Application;

/// <summary>
/// Each layer registers its OWN services in an extension method. The Api (the composition root,
/// Phase 4) simply calls <c>services.AddApplication()</c>. This keeps the wiring next to the code
/// it wires, and means the Api doesn't have to know every concrete class that lives in here.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // Scoped = one instance per web request, the natural lifetime for use-case work.
        // (We'll unpack Scoped vs Transient vs Singleton properly in Phase 4.)
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IProjectService, ProjectService>();
        services.AddScoped<ITaskService, TaskService>();

        // Scan this assembly and register every AbstractValidator<T> as IValidator<T>, so the
        // services above can have their IValidator<...> dependencies injected automatically.
        services.AddValidatorsFromAssemblyContaining<CreateUserRequestValidator>();

        return services;
    }
}
