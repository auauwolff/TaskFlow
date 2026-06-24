namespace TaskFlow.Application.Projects;

public sealed record ProjectDto(
    Guid Id,
    string Name,
    string? Description,
    Guid OwnerId,
    DateTimeOffset CreatedAt);

public sealed record CreateProjectRequest(string Name, Guid OwnerId, string? Description);
