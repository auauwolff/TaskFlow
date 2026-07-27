using FluentValidation;
using HotChocolate;
using HotChocolate.Execution;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Domain.Exceptions;

namespace TaskFlow.Api.GraphQL;

public sealed class TaskFlowGraphQLErrorFilter : IErrorFilter
{
    // Kept deliberately parallel to GlobalExceptionHandler.CreateProblemDetails: the same closed set
    // of exceptions, rendered as a GraphQL error code instead of an HTTP status. Adding a case to
    // one without the other is how the two transports drift apart.
    public IError OnError(IError error) => error.Exception switch
    {
        ValidationException exception => SafeError(error, exception.Message, "VALIDATION"),
        UnauthenticatedException => SafeError(
            error,
            "The request requires an authenticated TaskFlow user.",
            "UNAUTHENTICATED"),
        NotFoundException exception => SafeError(error, exception.Message, "NOT_FOUND"),
        ConflictException exception => SafeError(error, exception.Message, "CONFLICT"),
        DomainException exception => SafeError(error, exception.Message, "BUSINESS_RULE"),
        _ => error,
    };

    private static IError SafeError(IError error, string message, string code) => error
        .WithMessage(message)
        .WithCode(code);
}
