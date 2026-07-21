using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.OpenApi;
using Serilog;
using TaskFlow.Api.Authentication;
using TaskFlow.Api.ErrorHandling;
using TaskFlow.Api.GraphQL;
using TaskFlow.Application;
using TaskFlow.Application.Common.Interfaces;
using TaskFlow.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSerilog((services, configuration) => configuration
    .ReadFrom.Configuration(builder.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext());

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddOpenApi(options =>
    options.AddSchemaTransformer((schema, context, _) =>
    {
        if (context.JsonTypeInfo.Type.IsEnum)
            schema.Type = JsonSchemaType.String;

        return Task.CompletedTask;
    }));
builder.Services.AddProblemDetails(options =>
    options.CustomizeProblemDetails = context =>
        context.ProblemDetails.Extensions["traceId"] = context.HttpContext.TraceIdentifier);
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services
    .AddGraphQLServer()
    .AddQueryType<TaskQueries>()
    .AddMutationType<TaskMutations>()
    .AddErrorFilter<TaskFlowGraphQLErrorFilter>();

var oidc = builder.Configuration.GetSection("Authentication:Oidc");
var authority = oidc["Authority"]
    ?? throw new InvalidOperationException("Authentication:Oidc:Authority is not configured.");
var clientId = oidc["ClientId"]
    ?? throw new InvalidOperationException("Authentication:Oidc:ClientId is not configured.");
var clientSecret = oidc["ClientSecret"]
    ?? throw new InvalidOperationException("Authentication:Oidc:ClientSecret is not configured.");
var publicOrigin = oidc["PublicOrigin"]
    ?? throw new InvalidOperationException("Authentication:Oidc:PublicOrigin is not configured.");

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = CookieAuthenticationDefaults.AuthenticationScheme;
        options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    })
    .AddCookie(options =>
    {
        options.Cookie.Name = builder.Environment.IsDevelopment()
            ? "TaskFlow.Session"
            : "__Host-TaskFlow.Session";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
            ? CookieSecurePolicy.SameAsRequest
            : CookieSecurePolicy.Always;
        options.SlidingExpiration = true;
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    })
    .AddOpenIdConnect(options =>
    {
        options.Authority = authority;
        options.ClientId = clientId;
        options.ClientSecret = clientSecret;
        options.CallbackPath = oidc["CallbackPath"] ?? "/api/auth/callback";
        options.SignedOutCallbackPath = oidc["SignedOutCallbackPath"]
            ?? "/api/auth/signed-out";
        options.ResponseType = OpenIdConnectResponseType.Code;
        options.UsePkce = true;
        options.MapInboundClaims = false;
        options.GetClaimsFromUserInfoEndpoint = true;
        // The encrypted HttpOnly authentication ticket retains protocol tokens for OIDC logout;
        // no token is exposed to frontend JavaScript.
        options.SaveTokens = true;
        options.RequireHttpsMetadata = oidc.GetValue("RequireHttpsMetadata", true);
        options.Scope.Clear();
        options.Scope.Add("openid");
        options.Scope.Add("profile");
        options.Scope.Add("email");
        options.EventsType = typeof(OidcEvents);

        if (builder.Environment.IsDevelopment())
        {
            options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
            options.CorrelationCookie.SameSite = SameSiteMode.Lax;
            options.NonceCookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
            options.NonceCookie.SameSite = SameSiteMode.Lax;
        }
    });
builder.Services.AddAuthorization(options =>
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build());
builder.Services.AddAntiforgery(options => options.HeaderName = "X-CSRF-TOKEN");
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, HttpCurrentUser>();
builder.Services.AddScoped<OidcEvents>();

builder.Services.AddApplication();

var connectionString = builder.Configuration.GetConnectionString("TaskFlow")
    ?? throw new InvalidOperationException("Connection string 'TaskFlow' is not configured.");
builder.Services.AddInfrastructure(connectionString);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi().AllowAnonymous();
    app.UseSwaggerUI(options =>
        options.SwaggerEndpoint("/openapi/v1.json", "TaskFlow API v1"));
}

app.UseSerilogRequestLogging();
app.UseExceptionHandler();

if (!app.Environment.IsDevelopment())
    app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();
// Cookie-authenticated writes require CSRF proof; the OIDC form-post callback uses nonce and
// correlation validation from the OIDC middleware instead.
app.Use(async (context, next) =>
{
    var requiresValidation = context.User.Identity?.IsAuthenticated == true
        && context.Request.Path.StartsWithSegments("/api")
        && context.Request.Path != "/api/auth/callback"
        && !HttpMethods.IsGet(context.Request.Method)
        && !HttpMethods.IsHead(context.Request.Method)
        && !HttpMethods.IsOptions(context.Request.Method)
        && !HttpMethods.IsTrace(context.Request.Method);

    if (requiresValidation)
        await context.RequestServices.GetRequiredService<IAntiforgery>()
            .ValidateRequestAsync(context);

    await next(context);
});
app.MapControllers();
app.MapGraphQL("/api/graphql")
    .RequireAuthorization();

// RunWithGraphQLCommands behaves exactly like Run() when no arguments are passed. It additionally
// enables `dotnet run -- schema export`, which the frontend uses to snapshot the GraphQL contract
// for client code generation (see frontend `generate:graphql`) — the SDL is exported from the
// executable schema itself, so the snapshot can never drift from what the server actually serves.
await app.RunWithGraphQLCommandsAsync(args);
