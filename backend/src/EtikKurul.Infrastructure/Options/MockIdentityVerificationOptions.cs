namespace EtikKurul.Infrastructure.Options;

public class MockIdentityVerificationOptions
{
    public const string SectionName = "MockIdentityVerification";

    public List<string> FailureTckns { get; set; } = ["00000000000"];
}
