using Microsoft.EntityFrameworkCore;
using TaskFlow.Infrastructure.Persistence;
using Testcontainers.PostgreSql;

namespace TaskFlow.Infrastructure.Tests;

/// <summary>
/// A disposable PostgreSQL instance shared by every test in the collection.
/// <para>
/// These tests exist because the persistence claims in this repository — that the <c>Email</c> value
/// object survives a round trip, and that a lost concurrency race surfaces as a
/// <c>ConflictException</c> — are properties of PostgreSQL and the EF provider, not of C#. An
/// in-memory or SQLite double would answer a different question convincingly and wrongly: neither
/// has an <c>xmin</c> system column, so the concurrency token would silently do nothing and the test
/// would still pass.
/// </para>
/// <para>
/// The schema is created by running the real migrations rather than <c>EnsureCreated</c>, so a
/// migration that has drifted from the model fails here too.
/// </para>
/// </summary>
public sealed class PostgresFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder()
        .WithImage("postgres:17-alpine")
        .Build();

    public string ConnectionString => _container.GetConnectionString();

    public async Task InitializeAsync()
    {
        await _container.StartAsync();

        await using var db = CreateContext();
        await db.Database.MigrateAsync();
    }

    public Task DisposeAsync() => _container.DisposeAsync().AsTask();

    /// <summary>
    /// A context configured exactly as <c>AddInfrastructure</c> configures the real one. Tests take
    /// a fresh context per logical actor so that reads come from the database instead of another
    /// context's change tracker — which is the only way a concurrency conflict can be observed.
    /// </summary>
    public TaskFlowDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<TaskFlowDbContext>()
            .UseNpgsql(ConnectionString)
            .UseSnakeCaseNamingConvention()
            .Options;

        return new TaskFlowDbContext(options);
    }
}

/// <summary>
/// Starting a container takes seconds, so every test class shares one. Tests must therefore avoid
/// assuming an empty database and use their own unique data.
/// </summary>
/// <remarks>
/// xUnit's convention would name this <c>PostgresCollection</c>, which CA1711 rejects because the
/// suffix promises a collection type. The attribute identifies the collection by string, so the
/// class name is free.
/// </remarks>
[CollectionDefinition(Name)]
public sealed class PostgresDatabase : ICollectionFixture<PostgresFixture>
{
    public const string Name = "postgres";
}
