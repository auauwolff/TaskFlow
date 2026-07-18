namespace TaskFlow.Application.Projects;

public interface IProjectService
{
    Task<ProjectDto> CreateAsync(CreateProjectRequest request, CancellationToken cancellationToken = default);
    Task<ProjectDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ProjectDto>> ListByOwnerAsync(Guid ownerId, CancellationToken cancellationToken = default);
}
