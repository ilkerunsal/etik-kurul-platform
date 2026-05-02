using System.Text.Json.Serialization;
using EtikKurul.Api.Configuration;
using EtikKurul.Api.Health;
using EtikKurul.Infrastructure;
using EtikKurul.Infrastructure.Exceptions;
using EtikKurul.Infrastructure.Persistence;
using EtikKurul.Api.Authentication;
using EtikKurul.Api.Authorization;
using EtikKurul.Modules.Applications;
using EtikKurul.Modules.IdentityVerification;
using EtikKurul.Modules.UserProfiles;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    ContentRootPath = AppContext.BaseDirectory,
});

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
ProductionConfigurationValidator.Validate(builder.Configuration, builder.Environment);

var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey));

builder.Services.AddProblemDetails();
builder.Services
    .AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy("API process is running."), tags: ["live"])
    .AddCheck<DatabaseHealthCheck>("database", tags: ["ready"]);

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = signingKey,
            ClockSkew = TimeSpan.FromSeconds(30),
        };
    });
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(ApplicationPolicies.CanOpenApplication, policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.AddRequirements(new CanOpenApplicationRequirement());
    });

    options.AddPolicy(ApplicationPolicies.ManageExpertAssignments, policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireRole("secretariat");
    });

    options.AddPolicy(ApplicationPolicies.StartExpertReview, policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireRole("ethics_expert");
    });

    options.AddPolicy(ApplicationPolicies.ManageCommitteeAgenda, policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireRole("secretariat");
    });
});
builder.Services.AddScoped<IAuthorizationHandler, CanOpenApplicationAuthorizationHandler>();
builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddIdentityVerificationModule();
builder.Services.AddUserProfilesModule(builder.Configuration);
builder.Services.AddApplicationsModule();

var app = builder.Build();

await ApplicationDbInitializer.InitializeAsync(app.Services, app.Lifetime.ApplicationStopping);

app.UseExceptionHandler(exceptionHandlerApp =>
{
    exceptionHandlerApp.Run(async context =>
    {
        var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
        var statusCode = exception is AppException appException
            ? appException.StatusCode
            : StatusCodes.Status500InternalServerError;

        var title = exception is AppException knownException
            ? knownException.Title
            : "Unexpected error";

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = app.Environment.IsDevelopment() ? exception?.Message : null,
            Instance = context.Request.Path,
        };

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";
        await context.Response.WriteAsJsonAsync(problemDetails, cancellationToken: context.RequestAborted);
    });
});

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

if (builder.Configuration.GetValue("Hosting:EnableHttpsRedirection", !app.Environment.IsDevelopment()))
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = registration => registration.Tags.Contains("live"),
    ResponseWriter = WriteHealthResponseAsync,
});
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = registration => registration.Tags.Contains("ready"),
    ResponseWriter = WriteHealthResponseAsync,
});
app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = WriteHealthResponseAsync,
});
app.MapControllers();
app.Run();

static Task WriteHealthResponseAsync(HttpContext context, HealthReport report)
{
    context.Response.ContentType = "application/json";

    var payload = new
    {
        status = report.Status.ToString(),
        checks = report.Entries.Select(entry => new
        {
            name = entry.Key,
            status = entry.Value.Status.ToString(),
            description = entry.Value.Description,
            durationMs = entry.Value.Duration.TotalMilliseconds,
        }),
        totalDurationMs = report.TotalDuration.TotalMilliseconds,
    };

    return context.Response.WriteAsync(JsonSerializer.Serialize(payload), context.RequestAborted);
}

public partial class Program;
