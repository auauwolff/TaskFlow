using FluentValidation;
using HotChocolate;
using HotChocolate.Execution;
using TaskFlow.Application.Common.Exceptions;
using TaskFlow.Domain.Exceptions;

namespace TaskFlow.Api.GraphQL;

public sealed class TaskFlowGraphQLErrorFilter : IErrorFilter
{
    public IError OnError(IError error) => error.Exception switch
    {
        ValidationException exception => SafeError(error, exception.Message, "VALIDATION"),
        NotFoundException exception => SafeError(error, exception.Message, "NOT_FOUND"),
        ConflictException exception => SafeError(error, exception.Message, "CONFLICT"),
        DomainException exception => SafeError(error, exception.Message, "BUSINESS_RULE"),
        _ => error,
    };

    private static IError SafeError(IError error, string message, string code) => error
        .WithMessage(message)
        .WithCode(code);
}
