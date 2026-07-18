using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace TaskFlow.Infrastructure.Persistence;

/// <summary>
/// Used ONLY by the <c>dotnet ef</c> command-line tools at design time (creating migrations,
/// updating the database). At runtime the real app configures the DbContext through DI in the Api's
/// composition root (Phase 4) instead. EF's tooling falls back to this factory when the startup
/// project isn't a runnable app — which is exactly our situation now, since the Api doesn't exist yet.
/// </summary>
public sealed class TaskFlowDbContextFactory : IDesignTimeDbContextFactory<TaskFlowDbContext>
{
    public TaskFlowDbContext CreateDbContext(string[] args)
    {
        // Matches docker-compose.yml. This is for local dev tooling only; the running app will read
        // its connection string from configuration (appsettings / env vars) in Phase 4.
        const string connectionString =
            "Host=localhost;Port=5432;Database=taskflow;Username=taskflow;Password=taskflow_dev_pwd";

        var options = new DbContextOptionsBuilder<TaskFlowDbContext>()
            .UseNpgsql(connectionString)
            .UseSnakeCaseNamingConvention()
            .Options;

        return new TaskFlowDbContext(options);
    }
}
