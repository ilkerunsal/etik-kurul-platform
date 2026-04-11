namespace EtikKurul.Modules.IdentityVerification.Models;

public sealed record AuthenticatedUserResult(
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
    IReadOnlyList<string> Roles);
