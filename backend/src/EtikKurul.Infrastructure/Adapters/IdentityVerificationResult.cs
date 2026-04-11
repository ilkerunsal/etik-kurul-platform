namespace EtikKurul.Infrastructure.Adapters;

public sealed record IdentityVerificationResult(
    bool Success,
    string ProviderName,
    string ResponseCode);
