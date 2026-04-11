namespace EtikKurul.Infrastructure.Options;

public class VerificationCodeOptions
{
    public const string SectionName = "VerificationCodes";

    public int Length { get; set; } = 6;
    public int ExpiresInMinutes { get; set; } = 10;
}
