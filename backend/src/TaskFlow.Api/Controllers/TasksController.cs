using Microsoft.AspNetCore.Mvc;
using TaskFlow.Application.Tasks;

namespace TaskFlow.Api.Controllers;

[ApiController]
[Route("api/tasks")]
public sealed class TasksController(ITaskService tasks) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType<TaskItemDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TaskItemDto>> Create(
        CreateTaskRequest request,
        CancellationToken cancellationToken)
    {
        var task = await tasks.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = task.Id }, task);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType<TaskItemDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TaskItemDto>> GetById(Guid id, CancellationToken cancellationToken) =>
        Ok(await tasks.GetByIdAsync(id, cancellationToken));

    [HttpGet]
    [ProducesResponseType<IReadOnlyList<TaskItemDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<TaskItemDto>>> ListByProject(
        [FromQuery] Guid projectId,
        CancellationToken cancellationToken) =>
        Ok(await tasks.ListByProjectAsync(projectId, cancellationToken));

    [HttpPatch("{id:guid}/complete")]
    [ProducesResponseType<TaskItemDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TaskItemDto>> Complete(Guid id, CancellationToken cancellationToken) =>
        Ok(await tasks.CompleteAsync(id, cancellationToken));

    [HttpPatch("{id:guid}/assignee")]
    [ProducesResponseType<TaskItemDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TaskItemDto>> Assign(
        Guid id,
        AssignTaskRequest request,
        CancellationToken cancellationToken) =>
        Ok(await tasks.AssignAsync(id, request, cancellationToken));
}
