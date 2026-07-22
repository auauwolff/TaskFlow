using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Infrastructure.Persistence.Configurations;

internal sealed class TaskItemConfiguration : IEntityTypeConfiguration<TaskItem>
{
    public void Configure(EntityTypeBuilder<TaskItem> builder)
    {
        builder.ToTable("task_items");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(t => t.Description)
            .HasMaxLength(2000);

        // Store the enums as readable text ("Todo", "InProgress", "Done") instead of magic integers.
        // The DB is then human-inspectable in psql, and stays correct even if we reorder the enum.
        builder.Property(t => t.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(t => t.Priority)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(t => t.ProjectId).IsRequired();

        builder.Property(t => t.CreatedAt).IsRequired();

        // Indexes on the two id columns we filter by. AssigneeId is nullable, which is fine.
        builder.HasIndex(t => t.ProjectId);
        builder.HasIndex(t => t.AssigneeId);

        // Optimistic concurrency: two users can race on the same task (complete vs. assign). Without
        // a token the last write silently wins; with one, the losing SaveChanges throws and surfaces
        // as HTTP 409 / GraphQL CONFLICT (translated in TaskFlowDbContext). A uint row version is
        // mapped by Npgsql onto the xmin system column Postgres already stamps on every row, so this
        // costs no schema change — and as a shadow property the domain entity stays oblivious,
        // exactly like the rest of this mapping.
        builder.Property<uint>("xmin").IsRowVersion();
    }
}
