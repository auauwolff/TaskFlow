using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace TaskFlow.Infrastructure.Persistence;

/// <summary>
/// Used ONLY by the <c>dotnet ef</c> command-line tools at design time (creating migrations,
/// updating the database). At runtime the DbContext is configured through DI in the Api's
/// composition root, which reads the connection string from configuration.
/// <para>
/// This exists so <c>dotnet ef --project TaskFlow.Infrastructure</c> works without naming the Api as
/// the startup project. That matters more than it looks: it keeps migration tooling a concern of the
/// layer that owns persistence, rather than something that can only run by booting the web host.
/// </para>
/// </summary>
public sealed class TaskFlowDbContextFactory : IDesignTimeDbContextFactory<TaskFlowDbContext>
{
    public TaskFlowDbContext CreateDbContext(string[] args)
    {
        // Matches docker-compose.yml. Design-time tooling only - the running app reads its
        // connection string from configuration. `dotnet ef` can still be pointed at a different
        // database with `--connection`, which is how the e2e suite migrates its throwaway container.
        const string connectionString =
            "Host=localhost;Port=5432;Database=taskflow;Username=taskflow;Password=taskflow_dev_pwd";

        var options = new DbContextOptionsBuilder<TaskFlowDbContext>()
            .UseNpgsql(connectionString)
            .UseSnakeCaseNamingConvention()
            .Options;

        return new TaskFlowDbContext(options);
    }
}
