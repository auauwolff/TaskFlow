using FluentValidation;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Repositories;

namespace TaskFlow.Application.Projects;

public sealed class ProjectService : IProjectService
{
    private readonly IProjectRepository _projects;
    private readonly IUserRepository _users;          // needed to verify the owner exists
    private readonly IUnitOfWork _unitOfWork;
    private readonly IValidator<CreateProjectRequest> _validator;
    private readonly TimeProvider _timeProvider;

    public ProjectService(
        IProjectRepository projects,
        IUserRepository users,
        IUnitOfWork unitOfWork,
        IValidator<CreateProjectRequest> validator,
        TimeProvider timeProvider)
    {
        _projects = projects;
        _users = users;
        _unitOfWork = unitOfWork;
        _validator = validator;
        _timeProvider = timeProvider;
    }

    public async Task<ProjectDto> CreateAsync(CreateProjectRequest request, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(request, cancellationToken);

        // Cross-aggregate check: a project's owner must be a real user. Coordinating two
        // aggregates like this is exactly the Application layer's job — the Project entity can't
        // (and shouldn't) reach out to the user store itself.
        if (await _users.GetByIdAsync(request.OwnerId, cancellationToken) is null)
            throw new NotFoundException(nameof(User), request.OwnerId);

        var project = Project.Create(request.Name, request.OwnerId, _timeProvider, request.Description);

        await _projects.AddAsync(project, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return project.ToDto();
    }

    public async Task<ProjectDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var project = await _projects.GetByIdAsync(id, cancellationToken)
                      ?? throw new NotFoundException(nameof(Project), id);

        return project.ToDto();
    }

    public async Task<IReadOnlyList<ProjectDto>> ListByOwnerAsync(Guid ownerId, CancellationToken cancellationToken = default)
    {
        var projects = await _projects.ListByOwnerAsync(ownerId, cancellationToken);
        return projects.Select(p => p.ToDto()).ToList();
    }
}
