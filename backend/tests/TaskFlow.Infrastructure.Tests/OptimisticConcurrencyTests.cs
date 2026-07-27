using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Infrastructure.Tests;

/// <summary>
/// Every mutable aggregate maps PostgreSQL's <c>xmin</c> system column as an EF row version, so an
/// update carries the row's original version in its WHERE clause and affects nothing if another
/// transaction has since changed the row.
/// <para>
/// This is the behaviour the whole conflict path rests on: <c>TaskFlowDbContext</c> converts the
/// resulting EF exception into a <c>ConflictException</c>, and both delivery adapters already map
/// that to 409 and to <c>CONFLICT</c>. None of it can be observed without a real PostgreSQL, because
/// <c>xmin</c> is a PostgreSQL system column - which is exactly why it went untested for so long.
/// </para>
/// </summary>
[Collection(PostgresDatabase.Name)]
public sealed class OptimisticConcurrencyTests
{
    private static readonly DateTimeOffset Now = new(2026, 3, 14, 9, 26, 53, TimeSpan.Zero);

    private readonly PostgresFixture _postgres;
    private readonly TestTimeProvider _timeProvider = new(Now);

    public OptimisticConcurrencyTests(PostgresFixture postgres) => _postgres = postgres;

    private async Task<TaskItem> GivenAPersistedTask()
    {
        var task = TaskItem.Create(Guid.NewGuid(), "Ship the reference architecture", _timeProvider);

        await using var write = _postgres.CreateContext();
        write.Tasks.Add(task);
        await write.SaveChangesAsync();

        return task;
    }

    [Fact]
    public async Task TwoWritersRacingOnOneTask_LoserGetsAConflictException()
    {
        var task = await GivenAPersistedTask();

        // Two separate contexts, because two separate requests. Both read the same row and both
        // therefore hold the same original xmin.
        await using var first = _postgres.CreateContext();
        await using var second = _postgres.CreateContext();

        var firstView = await first.Tasks.SingleAsync(t => t.Id == task.Id);
        var secondView = await second.Tasks.SingleAsync(t => t.Id == task.Id);

        firstView.Complete(_timeProvider);
        await first.SaveChangesAsync();

        secondView.AssignTo(Guid.NewGuid());
        var losingSave = async () => await second.SaveChangesAsync();

        // The point of the assertion is the type. EF's DbUpdateConcurrencyException never escapes
        // Infrastructure: application code and both transports only know ConflictException, so a
        // leak here would be an architecture failure, not merely a different exception.
        (await losingSave.Should().ThrowAsync<ConflictException>())
            .Which.Message.Should().Contain(nameof(TaskItem));
    }

    [Fact]
    public async Task TheWinnersWrite_IsTheOneThatSurvives()
    {
        var task = await GivenAPersistedTask();

        await using (var first = _postgres.CreateContext())
        await using (var second = _postgres.CreateContext())
        {
            var firstView = await first.Tasks.SingleAsync(t => t.Id == task.Id);
            var secondView = await second.Tasks.SingleAsync(t => t.Id == task.Id);

            firstView.Complete(_timeProvider);
            await first.SaveChangesAsync();

            secondView.AssignTo(Guid.NewGuid());
            await Assert.ThrowsAsync<ConflictException>(() => second.SaveChangesAsync());
        }

        await using var read = _postgres.CreateContext();
        var persisted = await read.Tasks.SingleAsync(t => t.Id == task.Id);

        // A rejected write must be rejected whole. Losing the race and still having your assignee
        // land would be worse than either outcome on its own.
        persisted.Status.Should().Be(TaskItemStatus.Done);
        persisted.CompletedAt.Should().Be(Now);
        persisted.AssigneeId.Should().BeNull();
    }

    [Fact]
    public async Task SequentialUpdatesThroughOneContext_DoNotConflictWithThemselves()
    {
        var task = await GivenAPersistedTask();

        await using var db = _postgres.CreateContext();
        var tracked = await db.Tasks.SingleAsync(t => t.Id == task.Id);

        tracked.AssignTo(Guid.NewGuid());
        await db.SaveChangesAsync();

        tracked.Complete(_timeProvider);

        // A row version is only useful if it refreshes after a successful write. If EF kept the
        // pre-update xmin, the second save would race the first one and every edit after the first
        // would fail - a concurrency check that fires on a single user is worse than none.
        var secondSave = async () => await db.SaveChangesAsync();

        await secondSave.Should().NotThrowAsync();
    }

    [Fact]
    public async Task DeletingARowUnderneathAnUpdate_IsAlsoAConflict()
    {
        var task = await GivenAPersistedTask();

        await using var editor = _postgres.CreateContext();
        var editing = await editor.Tasks.SingleAsync(t => t.Id == task.Id);

        await using (var deleter = _postgres.CreateContext())
        {
            deleter.Tasks.Remove(await deleter.Tasks.SingleAsync(t => t.Id == task.Id));
            await deleter.SaveChangesAsync();
        }

        editing.Complete(_timeProvider);
        var save = async () => await editor.SaveChangesAsync();

        // "Someone changed it" and "someone removed it" arrive at the same place: zero rows matched.
        // Both must reach the caller as the same recoverable conflict rather than a 500.
        await save.Should().ThrowAsync<ConflictException>();
    }
}
