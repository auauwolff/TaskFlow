using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using TaskFlow.Application.Users;

namespace TaskFlow.Api.Authentication;

internal sealed class OidcEvents(IUserService users, IConfiguration configuration) : OpenIdConnectEvents
{
    public override Task RedirectToIdentityProvider(RedirectContext context)
    {
        var publicOrigin = configuration["Authentication:Oidc:PublicOrigin"];
        context.ProtocolMessage.RedirectUri =
            $"{publicOrigin!.TrimEnd('/')}{context.Options.CallbackPath}";

        return Task.CompletedTask;
    }

    public override Task RedirectToIdentityProviderForSignOut(RedirectContext context)
    {
        var publicOrigin = configuration["Authentication:Oidc:PublicOrigin"];
        context.ProtocolMessage.PostLogoutRedirectUri =
            $"{publicOrigin!.TrimEnd('/')}{context.Options.SignedOutCallbackPath}";

        return Task.CompletedTask;
    }

    public override async Task TicketReceived(TicketReceivedContext context)
    {
        var principal = context.Principal
            ?? throw new InvalidOperationException("OIDC validation did not produce a principal.");
        var issuer = principal.FindFirstValue("iss")
            ?? configuration["Authentication:Oidc:Authority"]
            ?? throw new InvalidOperationException("The identity provider issuer is unavailable.");
        var subject = principal.FindFirstValue("sub")
            ?? throw new InvalidOperationException("The identity provider did not return a subject claim.");
        var email = principal.FindFirstValue("email")
            ?? throw new InvalidOperationException("The identity provider did not return an email claim.");
        var emailVerified = bool.TryParse(
            principal.FindFirstValue("email_verified"),
            out var isVerified) && isVerified;
        var name = principal.FindFirstValue("name")
            ?? principal.FindFirstValue("preferred_username")
            ?? email;

        var user = await users.FindOrProvisionAsync(
            new ExternalUserProfile(issuer, subject, name, email, emailVerified),
            context.HttpContext.RequestAborted);

        if (principal.Identity is not ClaimsIdentity identity)
            throw new InvalidOperationException("The OIDC principal does not have a claims identity.");

        identity.AddClaim(new System.Security.Claims.Claim(
            TaskFlowClaimTypes.UserId,
            user.Id.ToString()));
    }
}
