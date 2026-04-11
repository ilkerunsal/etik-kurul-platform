namespace EtikKurul.Infrastructure.Adapters;

public sealed record IdentityVerificationRequest(
    string FirstName,
    string LastName,
    string Tckn,
    DateOnly BirthDate);
