using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.ValueObjects;

namespace TaskFlow.Infrastructure.Persistence.Configurations;

/// <summary>
/// How a <see cref="User"/> maps to the <c>users</c> table. THIS is the translation layer between
/// the pure domain object and the database schema — and it lives here in Infrastructure precisely
/// so the Domain never learns a database exists. (Remember the entity-vs-schema conversation:
/// the entity came first and owes the DB nothing; this file is where the DB catches up to it.)
/// </summary>
internal sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Name)
            .HasMaxLength(200)
            .IsRequired();

        // The Email VALUE OBJECT is stored as a single string column. The converter turns an Email
        // into its string on the way to Postgres, and rebuilds a *validated* Email on the way back
        // (via Email.Create) — so the value object survives the round-trip intact.
        builder.Property(u => u.Email)
            .HasConversion(
                email => email.Value,
                value => Email.Create(value))
            .HasColumnName("email")
            .HasMaxLength(320)
            .IsRequired();

        // Email is a user's natural identifier — enforce uniqueness at the database level too,
        // not just in the application's "email already exists" check.
        builder.HasIndex(u => u.Email).IsUnique();

        // Users have update behavior (rename, email change), so they get the same optimistic
        // concurrency protection — see the full explanation on TaskItemConfiguration.
        builder.Property<uint>("xmin").IsRowVersion();
    }
}
