using FluentValidation;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Domain.Exceptions;

namespace TaskFlow.Api.ErrorHandling;

public sealed partial class GlobalExceptionHandler(
    IProblemDetailsService problemDetailsService,
    ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    // Source-generated logging: the [LoggerMessage] generator emits a cached delegate, so the
    // message template is parsed once at startup rather than on every call, and no object[] is
    // allocated for the arguments. `partial` on the class is what lets the generator contribute
    // the method body.
    [LoggerMessage(
        EventId = 1000,
        Level = LogLevel.Error,
        Message = "An unhandled exception occurred while processing the request")]
    private static partial void LogUnhandledException(ILogger logger, Exception exception);

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var problemDetails = CreateProblemDetails(exception);
        httpContext.Response.StatusCode = problemDetails.Status ?? StatusCodes.Status500InternalServerError;

        if (httpContext.Response.StatusCode >= StatusCodes.Status500InternalServerError)
            LogUnhandledException(logger, exception);

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
        UnauthenticatedException => CreateProblem(
            StatusCodes.Status401Unauthorized,
            "Authentication required",
            "The request requires an authenticated TaskFlow user."),
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
