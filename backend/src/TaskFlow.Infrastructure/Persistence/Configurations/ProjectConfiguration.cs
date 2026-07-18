using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Infrastructure.Persistence.Configurations;

internal sealed class ProjectConfiguration : IEntityTypeConfiguration<Project>
{
    public void Configure(EntityTypeBuilder<Project> builder)
    {
        builder.ToTable("projects");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(p => p.Description)
            .HasMaxLength(2000);

        builder.Property(p => p.OwnerId).IsRequired();

        builder.Property(p => p.CreatedAt).IsRequired();

        // We reference User across an aggregate boundary by id only (no navigation property), so we
        // add a plain index on owner_id for fast "projects for this owner" lookups rather than a hard
        // foreign-key constraint. Cross-aggregate integrity is enforced in the application/domain.
        builder.HasIndex(p => p.OwnerId);
    }
}
