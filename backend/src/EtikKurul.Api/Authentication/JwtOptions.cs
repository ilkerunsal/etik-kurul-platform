namespace EtikKurul.Api.Authentication;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "EtikKurul.Api";

    public string Audience { get; set; } = "EtikKurul.Client";

    public string SigningKey { get; set; } = "change-this-signing-key-in-production-123456";

    public int ExpiresInMinutes { get; set; } = 120;
}
