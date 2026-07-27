using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.ValueObjects;

namespace TaskFlow.Infrastructure.Tests;

/// <summary>
/// The <c>Email</c> value object is stored as a plain string through a value converter. That
/// converter is the seam where a domain type meets a column, and it is the classic place for the
/// domain model to quietly stop being the domain model.
/// </summary>
[Collection(PostgresDatabase.Name)]
public sealed class EmailPersistenceTests
{
    private readonly PostgresFixture _postgres;

    public EmailPersistenceTests(PostgresFixture postgres) => _postgres = postgres;

    private static Email UniqueEmail() => Email.Create($"user-{Guid.NewGuid():N}@taskflow.test");

    [Fact]
    public async Task Email_SurvivesTheRoundTrip_AsAValidatedValueObject()
    {
        var email = UniqueEmail();
        var user = User.Create("Ada Lovelace", email);

        await using (var write = _postgres.CreateContext())
        {
            write.Users.Add(user);
            await write.SaveChangesAsync();
        }

        await using var read = _postgres.CreateContext();
        var reloaded = await read.Users.SingleAsync(u => u.Id == user.Id);

        // Not just the string: the converter runs Email.Create on the way back, so what comes out
        // of PostgreSQL is a validated value object with the domain's own equality semantics.
        reloaded.Email.Should().Be(email);
        reloaded.Email.Value.Should().Be(email.Value);
    }

    [Fact]
    public async Task Email_IsCanonicalizedBeforeItReachesTheColumn()
    {
        var raw = $"  MiXeD-{Guid.NewGuid():N}@TaskFlow.Test  ";
        var user = User.Create("Grace Hopper", Email.Create(raw));

        await using (var write = _postgres.CreateContext())
        {
            write.Users.Add(user);
            await write.SaveChangesAsync();
        }

        await using var read = _postgres.CreateContext();

        // Read the raw column rather than the entity, so the assertion is about what is actually
        // stored. Canonicalizing in the domain only pays off if the database agrees - a unique index
        // over a text column cannot tell that Bob@x.com and bob@x.com are the same address.
        var stored = await read.Database
            .SqlQuery<string>($"SELECT email AS \"Value\" FROM users WHERE id = {user.Id}")
            .SingleAsync();

        stored.Should().Be(raw.Trim().ToLowerInvariant());
    }

    [Fact]
    public async Task Email_ReloadedAndUntouched_IsNotSeenAsModified()
    {
        var user = User.Create("Alan Turing", UniqueEmail());

        await using (var write = _postgres.CreateContext())
        {
            write.Users.Add(user);
            await write.SaveChangesAsync();
        }

        await using var read = _postgres.CreateContext();
        var reloaded = await read.Users.SingleAsync(u => u.Id == user.Id);
        read.ChangeTracker.DetectChanges();

        // A value converter over a reference type is the standard way to get a phantom UPDATE on
        // every load: if EF compares Email instances by reference, an untouched entity looks dirty,
        // every read becomes a write, and the xmin token below starts losing races against itself.
        read.Entry(reloaded).State.Should().Be(EntityState.Unchanged);
        read.ChangeTracker.HasChanges().Should().BeFalse();
    }

    [Fact]
    public async Task Email_DuplicatedAcrossUsers_IsRejectedByTheDatabase()
    {
        var email = UniqueEmail();

        await using (var first = _postgres.CreateContext())
        {
            first.Users.Add(User.Create("First Owner", email));
            await first.SaveChangesAsync();
        }

        await using var second = _postgres.CreateContext();
        second.Users.Add(User.Create("Second Owner", email));

        // The application checks for a duplicate email before creating a user. That check is a race
        // under concurrency, so the unique index is the one that actually holds - and an index
        // declared in a configuration class is only real once a migration has applied it.
        var save = async () => await second.SaveChangesAsync();

        await save.Should().ThrowAsync<DbUpdateException>();
    }
}
