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
    }
}
