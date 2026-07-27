using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Domain.Repositories;
using TaskFlow.Infrastructure.Persistence;
using TaskFlow.Infrastructure.Persistence.Repositories;

namespace TaskFlow.Infrastructure;

/// <summary>
/// Registers everything the Infrastructure layer provides. The Api, as the composition root,
/// calls <c>services.AddInfrastructure(connectionString)</c>. This is the moment every port declared
/// by the inner layers (the repositories, the unit of work) gets matched to its concrete adapter.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string connectionString)
    {
        // AddDbContext registers TaskFlowDbContext as Scoped (one instance per web request) — the
        // right lifetime: each request gets a fresh change-tracker that's disposed when it ends.
        services.AddDbContext<TaskFlowDbContext>(options =>
            options.UseNpgsql(connectionString)
                   .UseSnakeCaseNamingConvention());

        // IUnitOfWork resolves to the SAME DbContext instance within a request. That shared instance
        // is the reason a repository's AddAsync and the unit of work's SaveChangesAsync operate on
        // the same change-tracker: stage with the repo, commit with the unit of work.
        services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<TaskFlowDbContext>());

        // Bind each Domain port to its EF adapter. The inner layers only ever see the interfaces.
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IExternalIdentityRepository, ExternalIdentityRepository>();
        services.AddScoped<IProjectRepository, ProjectRepository>();
        services.AddScoped<ITaskItemRepository, TaskItemRepository>();

        return services;
    }
}
