using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Api.Contracts.Auth;

public sealed record RegisterResponse(Guid UserId, AccountStatus AccountStatus);
