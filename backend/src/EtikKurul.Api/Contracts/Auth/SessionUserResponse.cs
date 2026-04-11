namespace EtikKurul.Api.Contracts.Auth;

public sealed record SessionUserResponse(
    Guid UserId,
    string FirstName,
    string LastName,
    string Email,
    string Phone,
    string AccountStatus,
    bool IsIdentityVerified,
    bool EmailVerified,
    bool PhoneVerified,
    int? ProfileCompletionPercent,
    IReadOnlyList<string> Roles,
    ApplicationAccessResponse ApplicationAccess);
