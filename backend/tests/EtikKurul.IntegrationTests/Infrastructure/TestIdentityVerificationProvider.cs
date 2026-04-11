using EtikKurul.Infrastructure.Adapters;

namespace EtikKurul.IntegrationTests.Infrastructure;

public class TestIdentityVerificationProvider : IIdentityVerificationProvider
{
    public bool ShouldSucceed { get; set; } = true;
    public string ResponseCode { get; set; } = "mock_match";

    public Task<IdentityVerificationResult> VerifyAsync(IdentityVerificationRequest request, CancellationToken cancellationToken)
    {
        return Task.FromResult(new IdentityVerificationResult(ShouldSucceed, "test_nvi", ShouldSucceed ? ResponseCode : "mock_no_match"));
    }
}
