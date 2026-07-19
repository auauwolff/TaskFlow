using FluentValidation;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Domain.Exceptions;

namespace TaskFlow.Api.ErrorHandling;

public sealed class GlobalExceptionHandler(
    IProblemDetailsService problemDetailsService,
    ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var problemDetails = CreateProblemDetails(exception);
        httpContext.Response.StatusCode = problemDetails.Status ?? StatusCodes.Status500InternalServerError;

        if (httpContext.Response.StatusCode >= StatusCodes.Status500InternalServerError)
            logger.LogError(exception, "An unhandled exception occurred while processing the request");

        return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = problemDetails,
            Exception = exception
        });
    }

    private static ProblemDetails CreateProblemDetails(Exception exception) => exception switch
    {
        ValidationException validationException => new HttpValidationProblemDetails(
            validationException.Errors
                .GroupBy(error => error.PropertyName)
                .ToDictionary(
                    group => group.Key,
                    group => group.Select(error => error.ErrorMessage).Distinct().ToArray()))
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Validation failed"
        },
        DomainException => CreateProblem(
            StatusCodes.Status400BadRequest,
            "A business rule was violated",
            exception.Message),
        NotFoundException => CreateProblem(
            StatusCodes.Status404NotFound,
            "Resource not found",
            exception.Message),
        ConflictException => CreateProblem(
            StatusCodes.Status409Conflict,
            "A resource conflict occurred",
            exception.Message),
        AntiforgeryValidationException => CreateProblem(
            StatusCodes.Status400BadRequest,
            "Antiforgery validation failed",
            "The request could not be verified."),
        _ => CreateProblem(
            StatusCodes.Status500InternalServerError,
            "An unexpected error occurred",
            "An unexpected error occurred while processing the request.")
    };

    private static ProblemDetails CreateProblem(int status, string title, string detail) => new()
    {
        Status = status,
        Title = title,
        Detail = detail
    };
}
