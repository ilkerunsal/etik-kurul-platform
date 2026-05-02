using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace EtikKurul.Api.Security;

public sealed class SecurityHeadersMiddleware(RequestDelegate next)
{
    private static readonly IReadOnlyDictionary<string, string> Headers = new Dictionary<string, string>
    {
        ["X-Content-Type-Options"] = "nosniff",
        ["X-Frame-Options"] = "DENY",
        ["Referrer-Policy"] = "no-referrer",
        ["Permissions-Policy"] = "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
        ["Cross-Origin-Resource-Policy"] = "same-origin",
        ["X-Permitted-Cross-Domain-Policies"] = "none",
        ["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    };

    public Task InvokeAsync(HttpContext context)
    {
        context.Response.OnStarting(() =>
        {
            foreach (var header in Headers)
            {
                context.Response.Headers.TryAdd(header.Key, header.Value);
            }

            return Task.CompletedTask;
        });

        return next(context);
    }
}

public static class SecurityHeadersMiddlewareExtensions
{
    public static IApplicationBuilder UseEtikKurulSecurityHeaders(this IApplicationBuilder app)
        => app.UseMiddleware<SecurityHeadersMiddleware>();
}
