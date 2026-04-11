using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Modules.IdentityVerification.Models;

public sealed record RegisterUserResult(Guid UserId, AccountStatus AccountStatus);
