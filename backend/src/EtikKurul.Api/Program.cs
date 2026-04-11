using System.Text.Json.Serialization;
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
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    ContentRootPath = AppContext.BaseDirectory,
});

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey));

builder.Services.AddProblemDetails();
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
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapControllers();
app.Run();

public partial class Program;
