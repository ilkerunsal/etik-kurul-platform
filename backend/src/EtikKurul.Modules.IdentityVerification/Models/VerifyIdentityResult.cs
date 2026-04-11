using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Modules.IdentityVerification.Models;

public sealed record VerifyIdentityResult(Guid UserId, bool Success, string ResponseCode, AccountStatus AccountStatus);
