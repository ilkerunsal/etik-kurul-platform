using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace EtikKurul.Api.Security;

public static class RateLimitingRegistration
{
    public static IServiceCollection AddEtikKurulRateLimiting(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var rateLimitOptions = configuration
            .GetSection(ApiRateLimitingOptions.SectionName)
            .Get<ApiRateLimitingOptions>() ?? new ApiRateLimitingOptions();

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
            {
                var isAuthMutation = context.Request.Path.StartsWithSegments("/auth")
                    && HttpMethods.IsPost(context.Request.Method);
                var scope = isAuthMutation ? "auth" : "general";
                var rule = isAuthMutation ? rateLimitOptions.Auth : rateLimitOptions.General;

                return CreatePartition(context, scope, rule);
            });
        });

        return services;
    }

    private static RateLimitPartition<string> CreatePartition(
        HttpContext context,
        string scope,
        FixedWindowRateLimitRule rule)
    {
        var partitionKey = CreatePartitionKey(context, scope);

        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey,
            _ => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = Math.Max(1, rule.PermitLimit),
                QueueLimit = Math.Max(0, rule.QueueLimit),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                Window = TimeSpan.FromSeconds(Math.Max(1, rule.WindowSeconds)),
            });
    }

    private static string CreatePartitionKey(HttpContext context, string scope)
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var remoteIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var path = context.Request.Path.Value?.ToLowerInvariant() ?? "/";

        return string.IsNullOrWhiteSpace(userId)
            ? $"{scope}:{path}:ip:{remoteIp}"
            : $"{scope}:{path}:user:{userId}";
    }
}
