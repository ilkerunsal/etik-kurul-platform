namespace EtikKurul.Infrastructure.Adapters;

public interface IIdentityVerificationProvider
{
    Task<IdentityVerificationResult> VerifyAsync(IdentityVerificationRequest request, CancellationToken cancellationToken);
}
