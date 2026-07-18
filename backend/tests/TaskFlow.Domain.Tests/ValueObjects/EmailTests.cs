using FluentAssertions;
using TaskFlow.Domain.Exceptions;
using TaskFlow.Domain.ValueObjects;

namespace TaskFlow.Domain.Tests.ValueObjects;

public sealed class EmailTests
{
    [Fact]
    public void Create_ValidEmail_CanonicalizesValue()
    {
        var email = Email.Create("  Ada@Example.COM  ");

        email.Value.Should().Be("ada@example.com");
        email.ToString().Should().Be("ada@example.com");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("missing-at-sign")]
    [InlineData("@example.com")]
    [InlineData("ada@")]
    [InlineData("ada@@example.com")]
    public void Create_InvalidEmail_ThrowsDomainException(string value)
    {
        var act = () => Email.Create(value);

        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Equality_SameCanonicalAddress_HasValueEquality()
    {
        var first = Email.Create("ADA@example.com");
        var second = Email.Create("ada@EXAMPLE.COM");

        first.Should().Be(second);
        first.GetHashCode().Should().Be(second.GetHashCode());
    }

    [Fact]
    public void Equality_DifferentAddress_IsNotEqual()
    {
        Email.Create("ada@example.com").Should().NotBe(Email.Create("grace@example.com"));
    }
}
