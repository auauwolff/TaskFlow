namespace TaskFlow.Infrastructure.Tests;

// Matches the equivalents in the Domain and Application test projects. Six lines duplicated three
// ways is cheaper than a shared test-utilities project that every suite must then depend on.
internal sealed class TestTimeProvider(DateTimeOffset utcNow) : TimeProvider
{
    public DateTimeOffset UtcNow { get; set; } = utcNow;

    public override DateTimeOffset GetUtcNow() => UtcNow;
}
