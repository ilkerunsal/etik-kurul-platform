namespace EtikKurul.Api.Security;

public sealed class ApiRateLimitingOptions
{
    public const string SectionName = "RateLimiting";

    public FixedWindowRateLimitRule General { get; init; } = new()
    {
        PermitLimit = 600,
        WindowSeconds = 60,
        QueueLimit = 0,
    };

    public FixedWindowRateLimitRule Auth { get; init; } = new()
    {
        PermitLimit = 20,
        WindowSeconds = 60,
        QueueLimit = 0,
    };
}

public sealed class FixedWindowRateLimitRule
{
    public int PermitLimit { get; init; } = 100;

    public int WindowSeconds { get; init; } = 60;

    public int QueueLimit { get; init; }
}
