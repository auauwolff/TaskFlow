using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Application.Projects;

namespace TaskFlow.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/projects")]
public sealed class ProjectsController(IProjectService projects) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType<ProjectDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProjectDto>> Create(
        CreateProjectRequest request,
        CancellationToken cancellationToken)
    {
        var project = await projects.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = project.Id }, project);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType<ProjectDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProjectDto>> GetById(Guid id, CancellationToken cancellationToken) =>
        Ok(await projects.GetByIdAsync(id, cancellationToken));

    [HttpGet]
    [ProducesResponseType<IReadOnlyList<ProjectDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ProjectDto>>> List(
        CancellationToken cancellationToken) =>
        Ok(await projects.ListAsync(cancellationToken));
}
