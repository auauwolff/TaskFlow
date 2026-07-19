using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Application.Users;

namespace TaskFlow.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(
    IUserService users,
    ICurrentUser currentUser,
    IAntiforgery antiforgery) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("login")]
    public IActionResult Login([FromQuery] string returnUrl = "/")
    {
        if (!Url.IsLocalUrl(returnUrl))
            return BadRequest("The return URL must be local to TaskFlow.");

        return Challenge(
            new AuthenticationProperties { RedirectUri = returnUrl },
            OpenIdConnectDefaults.AuthenticationScheme);
    }

    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType<UserDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserDto>> Me(CancellationToken cancellationToken) =>
        Ok(await users.GetByIdAsync(currentUser.UserId, cancellationToken));

    [Authorize]
    [HttpGet("antiforgery")]
    [ProducesResponseType<AntiforgeryTokenDto>(StatusCodes.Status200OK)]
    public ActionResult<AntiforgeryTokenDto> GetAntiforgeryToken()
    {
        var tokens = antiforgery.GetAndStoreTokens(HttpContext);
        return Ok(new AntiforgeryTokenDto(
            tokens.RequestToken
            ?? throw new InvalidOperationException("An antiforgery request token was not generated.")));
    }

    [Authorize]
    [HttpPost("logout")]
    public IActionResult Logout([FromQuery] string returnUrl = "/")
    {
        if (!Url.IsLocalUrl(returnUrl))
            return BadRequest("The return URL must be local to TaskFlow.");

        return SignOut(
            new AuthenticationProperties { RedirectUri = returnUrl },
            CookieAuthenticationDefaults.AuthenticationScheme,
            OpenIdConnectDefaults.AuthenticationScheme);
    }
}

public sealed record AntiforgeryTokenDto(string Token);
