using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Api.Contracts.Auth;

public sealed record VerifyIdentityResponse(Guid UserId, bool Success, string ResponseCode, AccountStatus AccountStatus);
