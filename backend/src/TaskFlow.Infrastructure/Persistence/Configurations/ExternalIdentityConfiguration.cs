using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Infrastructure.Persistence.Configurations;

internal sealed class ExternalIdentityConfiguration : IEntityTypeConfiguration<ExternalIdentity>
{
    public void Configure(EntityTypeBuilder<ExternalIdentity> builder)
    {
        builder.ToTable("external_identities");
        builder.HasKey(identity => identity.Id);

        builder.Property(identity => identity.UserId).IsRequired();
        builder.Property(identity => identity.Issuer).HasMaxLength(500).IsRequired();
        builder.Property(identity => identity.Subject).HasMaxLength(500).IsRequired();

        builder.HasIndex(identity => new { identity.Issuer, identity.Subject }).IsUnique();
        builder.HasIndex(identity => identity.UserId);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(identity => identity.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
