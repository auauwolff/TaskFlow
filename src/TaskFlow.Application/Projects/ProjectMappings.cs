using TaskFlow.Domain.Entities;

namespace TaskFlow.Application.Projects;

internal static class ProjectMappings
{
    public static ProjectDto ToDto(this Project project) =>
        new(project.Id, project.Name, project.Description, project.OwnerId, project.CreatedAt);
}
