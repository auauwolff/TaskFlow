using FluentValidation;

namespace TaskFlow.Application.Users;

/// <summary>
/// Input validation for <c>CreateUserRequest</c>, kept in its own class. This is the Open/Closed
/// Principle in action: to add or tweak a rule you edit (or add) a validator — you never touch
/// the service that uses it. FluentValidation discovers and runs these for us.
/// </summary>
public sealed class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(200);

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email is required.")
            .MaximumLength(320);
    }
}
