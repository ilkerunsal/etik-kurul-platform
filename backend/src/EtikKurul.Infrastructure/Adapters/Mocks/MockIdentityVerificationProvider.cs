using EtikKurul.Infrastructure.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace EtikKurul.Infrastructure.Adapters.Mocks;

public class MockIdentityVerificationProvider(
    IOptions<MockIdentityVerificationOptions> options,
    ILogger<MockIdentityVerificationProvider> logger) : IIdentityVerificationProvider
{
    private readonly HashSet<string> _failureTckns = options.Value.FailureTckns.ToHashSet(StringComparer.Ordinal);

    public Task<IdentityVerificationResult> VerifyAsync(IdentityVerificationRequest request, CancellationToken cancellationToken)
    {
        var success = !_failureTckns.Contains(request.Tckn);
        logger.LogInformation(
            "Mock identity verification completed for {FirstName} {LastName}. Success: {Success}",
            request.FirstName,
            request.LastName,
            success);

        return Task.FromResult(
            new IdentityVerificationResult(
                success,
                "mock_nvi",
                success ? "mock_match" : "mock_no_match"));
    }
}
