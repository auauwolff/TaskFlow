using FluentValidation;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Repositories;

namespace TaskFlow.Application.Projects;

public sealed class ProjectService : IProjectService
{
    private readonly IProjectRepository _projects;
    private readonly ICurrentUser _currentUser;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IValidator<CreateProjectRequest> _validator;
    private readonly TimeProvider _timeProvider;

    public ProjectService(
        IProjectRepository projects,
        ICurrentUser currentUser,
        IUnitOfWork unitOfWork,
        IValidator<CreateProjectRequest> validator,
        TimeProvider timeProvider)
    {
        _projects = projects;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
        _validator = validator;
        _timeProvider = timeProvider;
    }

    public async Task<ProjectDto> CreateAsync(CreateProjectRequest request, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(request, cancellationToken);

        var project = Project.Create(
            request.Name,
            _currentUser.UserId,
            _timeProvider,
            request.Description);

        await _projects.AddAsync(project, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return project.ToDto();
    }

    public async Task<ProjectDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var project = await _projects.GetByIdAsync(id, cancellationToken)
                       ?? throw new NotFoundException(nameof(Project), id);

        if (project.OwnerId != _currentUser.UserId)
            throw new NotFoundException(nameof(Project), id);

        return project.ToDto();
    }

    public async Task<IReadOnlyList<ProjectDto>> ListAsync(CancellationToken cancellationToken = default)
    {
        var projects = await _projects.ListByOwnerAsync(_currentUser.UserId, cancellationToken);
        return projects.Select(p => p.ToDto()).ToList();
    }
}
